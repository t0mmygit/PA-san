const { Model, DataTypes } = require('sequelize');
const sequelize = require('../handlers/dbHandler');

class User extends Model {}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        discordId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    }, {
        sequelize,
        modelName: 'User',
    },
)

module.exports = User;