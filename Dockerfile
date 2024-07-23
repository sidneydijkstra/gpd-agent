# Docker file that creates node image and executes ls
FROM alpine:latest

WORKDIR /app
COPY . .

# Install nodejs
RUN apk add --update nodejs npm
RUN npm install

CMD ["node", "index.mjs", "ws://192.168.1.2:8888". "http://192.168.1.2:3000/api"]

# docker run -it --mount src=C:\projects\git_cicd\gpd\server\.wogpd\.,target=/workdir,type=bind alpine-ls node ./src/modules/runner/soloJobRunner.mjs ${transactionGuid} ${repoGuid} ${pipelineGuid}
# \.wogpd\sidneydijkstra-Vueam-8bf32c98-bcaf-4aec-8f25-a23324fed822

# Start agent
# docker run -it -d --mount src=C:\projects\git_cicd\gpd\server\.wogpd\.,target=/workdir,type=bind gpd-agent