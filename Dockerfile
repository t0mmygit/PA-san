FROM node:18-alpine

ARG BUILD_VERSION=dev
LABEL version=$BUILD_VERSION

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

CMD ["node", "index.js"]