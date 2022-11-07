FROM node:16-alpine

RUN apk update && \
  apk upgrade && \
  apk add --no-cache pulseaudio && \
  adduser -u "$(id -u)" user

WORKDIR /app

COPY package.json .
COPY yarn.lock .
RUN yarn install && \
  yarn cache clean

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

COPY src src
COPY tsconfig.json .

ENTRYPOINT [ "/app/entrypoint.sh" ]