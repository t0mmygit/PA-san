const { Model, DataTypes } = require('sequelize');
const sequelize = require('@handlers/dbHandler');
const User = require('@models/User');

class Inventory extends Model {}

Inventory.init(
    {
        id: {
            primaryKey: true,
            autoIncrement: true,
            type: DataTypes.INTEGER,
        },
        user_id: {
            type: DataTypes.INTEGER,
            references: {
                model: User,
                key: 'id',
            },
        },
        is_private: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        ticket_quantity: {
            type: DataTypes.INTEGER,
        }
    },
    {
        sequelize,
        underscored: true,
        modelName: 'Inventory',
    }
);

Inventory.belongsTo(User);

module.exports = Inventory;