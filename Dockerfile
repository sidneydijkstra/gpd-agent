# Docker file that creates node image and executes ls
FROM alpine:latest

WORKDIR /app
COPY . .

# Install nodejs
RUN apk add --update nodejs npm
RUN npm install

CMD ["node", "./src/runner.js"]

# Start agent
# docker build -t gpd-agent .
# docker run -it -d -e AGENT_MQTT_URL=ws://192.168.1.2:8888 -e AGENT_API_URL=http://192.168.1.2:3000/api gpd-agent
# node .\src\runner.js --mqtt ws://localhost:8888 --api http://localhost:3000/api --dir D:/04_Projects/gpd-agent/.work --name upd-test