"use strict";

const { Model } = require("sequelize");
const schema = require("@schemas/channel-settings");

module.exports = (sequelize, DataTypes) => {
    class Channel extends Model {
        static associate(models) {
            Channel.belongsTo(models.Guild, { foreignKey: "guild_id" });
        }
    }

    Channel.init(
        {
            guild_id: {
                type: DataTypes.STRING,
                references: {
                    model: "guilds",
                    key: "id",
                },
            },
            discord_channel_id: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            settings: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: JSON.stringify(schema.validate({})),
            },
        },
        {
            sequelize,
            modelName: "Channel",
            underscored: true,
        }
    );

    return Channel;
};
