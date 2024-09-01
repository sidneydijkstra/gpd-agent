import fs from 'fs';
import { FileLogger } from './helpers/logger.js';
import { unzipFolder, zipFolder } from './helpers/zipHelper.js';
import { parseConfigString, processConfig } from './helpers/configParser.js';
import { getTransaction, getTransactionTasks, getWork, uploadArtifacts, getStorage } from './api/serverApi.js';
import { jobs as storedJobs } from './jobs/index.js';

import pipelineStatus from './enums/pipelineStatus.js';
import pipelineTaskStatus from './enums/pipelineTaskStatus.js';

function createFolder(path){
    // Create folder if it does not exist
    if(!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}

function hasContent(path){
    // Check if folder contains files or folders
    return fs.existsSync(path) ? fs.readdirSync(path).length > 0 : false
}

export function prepareAgent(baseApiUrl, agentGuid, workFolderPath, pipelineGuid, transactionGuid){
    return new Promise((resolve, reject) => {
        // Create the default work folder
        createFolder(workFolderPath)

        // Create the current work folder
        var workPath = `${workFolderPath}/${transactionGuid}`
        createFolder(workPath)
        createFolder(`${workPath}/project`)
        createFolder(`${workPath}/storage`)
        createFolder(`${workPath}/artifacts`)
        
        // Create file logger
        var logger = new FileLogger(`${workPath}/agent.log`)
        // Log the start of the job
        logger.log(`------------------\nHello from agent ${agentGuid}\n------------------\n`)
        logger.log(`Preparing pipeline ${pipelineGuid}`)

        // Get the work
        var projectPath = `${workPath}/project.zip`
        getWork(baseApiUrl, transactionGuid, projectPath)
            .then(() => {
                logger.log('Downloaded work')
                // Unzip the work
                unzipFolder(projectPath, `${workPath}/project`)
                    .then(() => {
                        logger.log('Unzipped work')
                        resolve(workPath)
                    })
                    .catch((error) => {
                        logger.log(`Error unzipping work: ${error}`)
                        reject()
                    })
            })
            .catch((error) => {
                logger.log(`Error getting work: ${error}`)
                reject()
            })
        })
}

export async function executeAgent(baseApiUrl, mqttClient, agentGuid, workFolderPath, pipelineGuid, transactionGuid){
    // Create file logger
    var logger = new FileLogger(`${workFolderPath}/agent.log`)
    // Log the start of the job
    logger.log(`Running pipeline ${pipelineGuid}`)

    // Get the transaction
    var transaction = await getTransaction(baseApiUrl, pipelineGuid, transactionGuid)
    if(transaction == null){
        logger.log('Transaction not found')
        return
    }
    logger.log(transaction)

    // Get the tasks
    var tasks = await getTransactionTasks(baseApiUrl, pipelineGuid, transactionGuid)
    if(tasks == null){
        logger.log('Tasks not found')
        return
    }
    logger.log(tasks)

    // Sort task by order
    tasks.sort((a, b) => a.order - b.order)
    
    // Update the transaction status
    transaction.status = pipelineStatus.running
    // Notify server that the transaction is running
    mqttClient.publish(`agent/${agentGuid}/trans-running`, JSON.stringify(transaction))
    mqttClient.publish(`trans/${transactionGuid}`, JSON.stringify(transaction))

    logger.log(`Loading configuration`)
    // Get the config
    var jobConfig = transaction.config.replace(/\\n/g, '\n').replace(/\\"/g, '\"').slice(1,-1)
    var parsedConfig = parseConfigString(jobConfig)

    var storage = parsedConfig.storage ?? null
    
    if(storage){
        logger.log(`Loading storage`)
        const store = {}
        // Get the storage
        for (var storageItem of storage){
            // Check if storage item has name when using guid
            if(storageItem.guid && storageItem.name)
                continue

            // Get the storage item
            await getStorage(baseApiUrl, transactionGuid, storageItem)
                .then((response) => {
                    logger.log(`Received storage ${JSON.stringify(response)}`)

                    // Prepare the storage item inside the store
                    const name = storageItem.alias ? storageItem.alias : storageItem.name
                    store[name] = response.type == 'Json' ? JSON.parse(response.content) : response.content
                })
                .catch((error) => {
                    logger.log(`Error getting storage ${storageItem}: ${error}`)
                })
        }

        logger.log('Preparing configuration')

        // Replace all variables in the config
        parsedConfig = processConfig(parsedConfig, /\${(.*?)}/g, (content) => {
            try {
                var vars = content.split('.')
                var replacement = vars.length == 1 ? store[vars[0]] || content : store[vars[0]][vars[1]] || content
                return replacement
            } catch (e) {
                return content
            }
        })

        logger.log(parsedConfig, JSON.stringify(parsedConfig))
    }

    var jobs = parsedConfig.jobs
    
    // Loop over all jobs
    for (var job of jobs){
        logger.log(`Running job ${job.name}`)
        var taskConfigs = job.tasks;

        for (var i = 0; i < taskConfigs.length; i++){
            // Get the task and task config
            var task = tasks[i]
            var taskConfig = taskConfigs[i]

            // Set the task to running status
            task.status = pipelineTaskStatus.running
            // Notify server that the task is running
            mqttClient.publish(`agent/${agentGuid}/task-running`, JSON.stringify(task))
            mqttClient.publish(`task/${task.guid}`, JSON.stringify(task))
            
            logger.log(`Running task ${taskConfig.name} - ${task.guid}`)
            
            // Delay for debugging
            await new Promise(r => setTimeout(r, 1000));
            // Create task logger
            var taskLogger = new FileLogger(`${workFolderPath}/agent.log`)
            // Start to record the logger
            taskLogger.record()
            // Log task output
            taskLogger.onLog((message) => {
                // Publish the task log
                mqttClient.publish(`task/${task.guid}/stream`, JSON.stringify({
                    status: pipelineTaskStatus.running,
                    output: message
                }))
            })

            // Run the job
            var taskResult = false
            if(storedJobs.hasOwnProperty(taskConfig.name)){
                try {
                    taskResult = await storedJobs[taskConfig.name](taskConfig, workFolderPath, taskLogger)
                    logger.log(`Task ${taskConfig.name} - ${task.guid} completed`)
                } catch (error) {
                    logger.log(`Error running job ${taskConfig.name}: ${error}`)
                }
            } else {
                logger.log(`Job ${taskConfig.name} not found`)
            }
            
            var taskStatus = taskResult ? pipelineTaskStatus.completed : pipelineTaskStatus.failed

            // Publish the task log completion
            mqttClient.publish(`task/${task.guid}/stream`, JSON.stringify({
                status: taskStatus,
                output: ''
            }))
            // Stop event on logger
            taskLogger.offLog()

            // Update the task completion
            task.completed = true
            task.status = taskStatus
            task.content = taskLogger.recordResult()
            // Notify server that the task is completed
            mqttClient.publish(`agent/${agentGuid}/task-completed`, JSON.stringify(task))
            mqttClient.publish(`task/${task.guid}`, JSON.stringify(task))
            
            logger.log(`Task ${taskConfig.name} - ${task.guid} completed`)
        }

        logger.log(`Job ${job.name} completed`)

    }

    logger.log(`All jobs completed`)

    // Check if any artifacts
    if(hasContent(`${workFolderPath}/artifacts`)){
        logger.log(`Uploading artifacts`)
        // Upload the artifacts
        zipFolder(`${workFolderPath}/artifacts`, `${workFolderPath}/artifacts.zip`)
            .then(() => {
                logger.log('Zipped artifacts')
                uploadArtifacts(baseApiUrl, transactionGuid, `${workFolderPath}/artifacts.zip`)
                    .then(() => {
                        logger.log('Uploaded artifacts')
                    })
                    .catch((error) => {
                        logger.log(`Error uploading artifacts: ${error}`)
                    })
            })
            .catch((error) => {
                logger.log(`Error zipping artifacts: ${error}`)
            })
    }
    
    // Update the transaction status
    transaction.status = pipelineStatus.completed
    // Notify server that the transaction is completed
    mqttClient.publish(`agent/${agentGuid}/trans-completed`, JSON.stringify(transaction))
    mqttClient.publish(`trans/${transactionGuid}`, JSON.stringify(transaction))
    // TODO: solve issue where publish is not working when function returns to soon!
    await new Promise(r => setTimeout(r, 2000));

    logger.log(`Transaction ${transactionGuid} completed`)
}