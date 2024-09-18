const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Inventory extends Model {
        static associate(models) {
            Inventory.belongsTo(models.User);
        }

        setTicketQuantity(ticket) {
            this.ticket_quantity = ticket;
            this.save();
        }

        hasTicket() {
            return this.ticket_quantity > 0;
        }
    }

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
                    model: 'users',
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

    return Inventory;
}