const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
});

console.log('Authenticating to the database...');

sequelize.authenticate()
    .then(() => {
        sequelize.sync()
            .then(() => console.log('Database synced!'))
            .catch(error => console.error('Unable to sync the database:', error));
    })
    .catch(error => console.error('Unable to connect to the database:', error));

module.exports = sequelize;