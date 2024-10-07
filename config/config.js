const pino = require('pino')
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// NOTE: config.js is currently set to public
module.exports = {
    development: {
        host: 'localhost',  
        dialect: 'sqlite',
        storage: 'database.sqlite',
        logging: message => logger.info(message),
    },
    production: {
        host: 'localhost',
        dialect: 'sqlite',
        storage: 'database.sqlite',
        logging: false,
    }
}