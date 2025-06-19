const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class UserPalette extends Model {
        static associate(models) {
            UserPalette.belongsTo(models.User, { foreignKey: "userId" });
            UserPalette.belongsTo(models.Palette, { foreignKey: "paletteId" });
        }
    }

    UserPalette.init(
        {
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            sequelize,
            timestamps: false,
            underscored: true,
        }
    );

    return UserPalette;
};
