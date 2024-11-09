FROM node:16

EXPOSE 3000

EXPOSE 8080

docker pull gprakhar/meta:latest

docker run --rm gprakhar/meta:latest