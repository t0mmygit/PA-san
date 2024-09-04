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
        ticket_quantity: {
            type: DataTypes.INTEGER,
        }
    }, {
        sequelize,
        modelName: 'Inventory',
    }
);

Inventory.belongsTo(User);

module.exports = Inventory;