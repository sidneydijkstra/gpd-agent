# GPD-Agent
GPD-Agent is the core agent system used by the GPD project. It includes a runner script that allows you to start the agent via the Node.js CLI, as well as a spawn function for initializing the agent within an existing Node.js application. This project manages all agent-related logic for GPD and is essential for running distributed tasks across the CI/CD environment.


## Setup
You can run the agent in two ways:

1. Directly from the terminal using Node.js.
2. Using Docker.

#### Running the Agent via Terminal
To run the agent from the terminal, you'll first need to create a working directory. This folder will be used for file storage and task management by the agent. Once the directory is ready, use the following command to start the agent:
```bash
node .\src\runner.js --mqtt ws://localhost:8888 --api http://localhost:3000/api --dir D:/path/to/work/dir --name agent-name
```
- `--mqtt`: The WebSocket URL for the MQTT server the agent will connect to.
- `--api`: The URL of the API server.
- `--dir`: The path to the working directory for file storage.
- `--name`: (Optional) The name of the agent. If not provided, the system will generate a random name.

#### Running the Agent via Docker
To run the agent using Docker, you'll first need to build a Docker image for the agent. You can do this by running:
```bash
docker build -t gpd-agent .
```

Once the image is built, run the Docker container with the following command:
```bash
docker run -it -d -e AGENT_MQTT_URL=ws://localhost:8888 -e AGENT_API_URL=http://localhost:3000/api agent-name
```

## Logging
The agent generates detailed logs to help monitor its operations and tasks. Key log files include:

- `{agent-name}.runner.log`: This log file contains detailed information about the tasks the agent has executed. Each agent will generate its own log file based on its name.

- `agent.guid`: This file contains the unique GUID (Globally Unique Identifier) assigned to the agent. It is used for tracking the agent across the system.

- `agent.name`: If you do not provide an agent name via the --name argument or environment variables, this file will be automatically created to store a randomly generated agent name.