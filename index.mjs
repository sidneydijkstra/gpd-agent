import useMqttClient from "./src/mqtt/mqttClient.mjs"
import { getSetting } from "./src/api/serverApi.mjs"
import { executeAgent } from "./src/agent.mjs"

// Get arguments string serverMqttUrl serverApiUrl
if(process.argv.length < 4){
    console.log('Missing arguments')
    process.exit(1)
}

// Parse arguments
var serverMqttUrl = process.argv[2]
var serverApiUrl = process.argv[3]

console.log(`[agent] Starting agent with urls: ${serverMqttUrl} and ${serverApiUrl}`)

async function main(){
    // Use settings endpoint to check if there is a connection with the server
    await getSetting(serverApiUrl, 'agent')
        .then((setting) => {
            console.log("[agent] Connected with server")
        })
        .catch((error) => {
            console.log("[agent] Could not get settings from server. This is probably related to the server not being available. Output: ", error)
            process.exit(1)
        })

    // Create the callback for the mqtt client
    const onMessageCallback = (topic, message) => {
        if(topic == "agent/exec"){
            var data = JSON.parse(message.toString())
            console.log(`[agent] Execute: `, data)
            executeAgent(serverApiUrl, mqttClient, data.agentGuid, data.workFolderPath, data.pipelineGuid, data.transactionGuid)
        }else if(topic == "agent/quit"){
            console.log("[agent] Quitting agent")
            process.exit(0)
        }
    }

    // Create the mqtt client and attach the onConnect and onDisconnect callbacks
    const mqttClient = useMqttClient(serverMqttUrl, () => {
        console.log("[agent] Agent connected to mqtt server")

        // Subscribe to the needed topics and attach the onMessageCallback
        mqttClient.subscribe('agent/exec', (err) => {})
        mqttClient.subscribe('agent/quit', (err) => {})
        mqttClient.on("message", onMessageCallback)

        console.log("[agent] Agent is running")
    }, () => {
        console.log("[agent] Agent disconnected from mqtt server")

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