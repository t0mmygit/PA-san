const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => { 
    class User extends Model {
        static associate(models) {
            User.hasOne(models.Inventory);
        }

        static getByDiscordId(discordId) {
            return this.findOne({ where: { discord_id: discordId }});
        }
    }

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

    return User;
}