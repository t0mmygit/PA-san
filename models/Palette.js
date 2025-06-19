const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Palette extends Model {
        static associate(models) {
            Palette.belongsTo(models.User, {
                as: "owner",
                foreignKey: "ownerId",
            });

            Palette.belongsTo(Palette, {
                as: "parent",
                foreignKey: "parentId",
            });

            Palette.belongsToMany(models.User, {
                through: models.UserPalette,
                onDelete: "CASCADE",
            });
        }
    }

    Palette.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            catalog: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            isPublic: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            sequelize,
            underscored: true,
            modelName: "Palette",
        }
    );

    return Palette;
};
