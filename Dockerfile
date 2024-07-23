# Docker file that creates node image and executes ls
FROM alpine:latest

WORKDIR /app
COPY . .

# Install nodejs
RUN apk add --update nodejs npm
RUN npm install

CMD ["node", "./src/runner.js", "ws://192.168.1.2:8888", "http://192.168.1.2:3000/api"]
#CMD ["node index.js ws://192.168.1.2:8888 http://192.168.1.2:3000/api"]

# Start agent
# docker run -it -d --mount src=C:\projects\git_cicd\gpd\server\.wogpd\.,target=/workdir,type=bind gpd-agent