import 'dotenv/config'
import args from "args"
import { v4 } from 'uuid'
import useMqttClient from "./mqtt/mqttClient.js"
import { onExit } from "./helpers/processHelper.js"
import { prepareAgent, executeAgent } from "./agent.js"
import { loadName, loadGuid } from "./helpers/localStorageHelper.js"
import { FileLogger } from "./helpers/logger.js"

const version = '1.0.16'

args
    .option('mqtt', 'The url of the mqtt server')
    .option('api', 'The url of the api server')
    .option('name', 'The name of the agent')
    .option('dir', 'The working directory of the agent', '/workdir')

const flags = args.parse(process.argv)
console.log(flags)

// Parse arguments
var serverMqttUrl = process.env.AGENT_MQTT_URL ?? flags.mqtt
var serverApiUrl = process.env.AGENT_API_URL ?? flags.api
var name = process.env.AGENT_NAME != null ? loadName(process.env.AGENT_NAME) : flags.name ?? loadName()
var workDir = flags.dir

var logger = new FileLogger(`${name}.runner.log`, true)

logger.log(`[agent] Starting agent (${name}) with urls: ${serverMqttUrl} and ${serverApiUrl}`)

async function main(){
    onExit(async () => {
        logger.log("[agent] Quitting agent")
        mqttClient.publish('agent/unregister', name)
        // wait 2 seconds for the mqtt message to be sent
        await new Promise(resolve => setTimeout(resolve, 2000))
    })

    // Create the callback for the mqtt client
    const onMessageCallback = (topic, message) => {
        if(topic == "agent/exec"){
            var data = JSON.parse(message.toString())

            if(data.agentGuid != name)
                return

            logger.log(`[agent] Executing: `, data)

            prepareAgent(serverApiUrl, name, workDir, data.pipelineGuid, data.transactionGuid)
                .then((workPath) => {
                    logger.log(`[agent] Prepared execution ${data.transactionGuid}`)
                    executeAgent(serverApiUrl, mqttClient, data.agentGuid, workPath, data.pipelineGuid, data.transactionGuid)
                        .finally(() => {
                            logger.log(`[agent] Finished execution ${data.transactionGuid}`)
                        })
                })
                .catch((error) => {
                    logger.log(`[agent] Error preparing execution: ${error}`)
                })
        }else if(topic == "agent/quit"){
            var data = message.toString()
            
            if(data != name)
                return

            logger.log("[agent] Quitting agent")
            process.exit(0)
        }
    }

    // Create the mqtt client and attach the onConnect and onDisconnect callbacks
    const mqttClient = useMqttClient(serverMqttUrl, () => {
        logger.log("[agent] Agent connected to mqtt server")

        // Subscribe to the needed topics and attach the onMessageCallback
        mqttClient.subscribe('agent/exec', (err) => {})
        mqttClient.subscribe('agent/quit', (err) => {})
        mqttClient.on("message", onMessageCallback)

        // If agent is local agent use 'local' as id, otherwise generate a new uuid id
        const guid = name == 'local' ? 'local' : loadGuid(v4())
        mqttClient.publish('agent/register', JSON.stringify({
            guid: guid,
            name: name,
            version: version
        }))

        logger.log("[agent] Agent is running")
    }, () => {
        logger.log("[agent] Agent disconnected from mqtt server")

        // Unsubscribe from the topics and detach the onMessageCallback
        mqttClient.unsubscribe('agent/exec', (err) => {})
        mqttClient.unsubscribe('agent/quit', (err) => {})
        mqttClient.off("message", onMessageCallback)
    }, (error) => {})
}

// Run the main function
(async () => {
    await main()
})()

export default main