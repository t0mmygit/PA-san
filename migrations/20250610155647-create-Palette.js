"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("palettes", {
            id: {
                type: Sequelize.DataTypes.UUID,
                defaultValue: Sequelize.DataTypes.UUIDV4,
                primaryKey: true,
            },
            owner_id: {
                type: Sequelize.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            parent_id: {
                type: Sequelize.DataTypes.UUID,
                references: {
                    model: "palettes",
                    key: "id",
                },
            },
            name: {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
            },
            catalog: {
                type: Sequelize.DataTypes.JSON,
                allowNull: false,
            },
            is_public: {
                type: Sequelize.DataTypes.BOOLEAN,
                defaultValue: true,
            },
            created_at: Sequelize.DataTypes.DATE,
            updated_at: Sequelize.DataTypes.DATE,
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("palettes");
    },
};
