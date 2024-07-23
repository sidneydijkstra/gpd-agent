import mqtt from "mqtt"

export default function useMqttClient(url, onConnect, onDisconnect, onError){
    const mqttClient = mqtt.connect(url)

    mqttClient.on('connect', function () {
        // console.log('[mqtt] Connected to MQTT server');

        if(onConnect){
            onConnect()
        }
    })
    
    mqttClient.on('close', function(){
        // console.log('[mqtt] Disconnected from MQTT server');

        if(onDisconnect){
            onDisconnect()
        }
    })

    mqttClient.on('error', function (error) {
        // console.log('[mqtt] Error: ', error);

        if(onError){
            onError(error)
        }
    })

    return mqttClient
}