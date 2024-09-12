const { Model, DataTypes } = require('sequelize');
const sequelize = require('@handlers/dbHandler');

class User extends Model {}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        discord_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    },
    {
        sequelize,
        underscored: true,
        modelName: 'User',
    },
);

module.exports = User;