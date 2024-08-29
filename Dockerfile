FROM node:18-alpine

WORKDIR /user/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

CMD ["node", "index.js"]