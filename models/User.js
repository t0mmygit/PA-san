const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.hasMany(models.Palette, {
                as: "owner",
                foreignKey: "ownerId",
            });
            User.belongsToMany(models.Palette, { through: models.UserPalette });
        }
    }

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
        },
        {
            sequelize,
            underscored: true,
        }
    );

    return User;
};
