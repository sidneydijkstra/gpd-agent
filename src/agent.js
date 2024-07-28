import fs from 'fs';
import { FileLogger } from './helpers/logger.js';
import { unzipFolder } from './helpers/zipHelper.js';
import { parseConfigString } from './helpers/configParser.js';
import { getTransaction, getTransactionTasks, getWork } from './api/serverApi.js';
import { jobs as storedJobs } from './jobs/index.js';

import pipelineStatus from './enums/pipelineStatus.js';
import pipelineTaskStatus from './enums/pipelineTaskStatus.js';

function createFolder(path){
    if(!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
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
        getWork(baseApiUrl, pipelineGuid, transactionGuid, projectPath)
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
    
    // Update the transaction status
    transaction.status = pipelineStatus.completed
    // Notify server that the transaction is completed
    mqttClient.publish(`agent/${agentGuid}/trans-completed`, JSON.stringify(transaction))
    mqttClient.publish(`trans/${transactionGuid}`, JSON.stringify(transaction))
    // TODO: solve issue where publish is not working when function returns to soon!
    await new Promise(r => setTimeout(r, 2000));

    logger.log(`Transaction ${transactionGuid} completed`)
}