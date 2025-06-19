"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("user_palettes", {
            user_id: {
                type: Sequelize.DataTypes.INTEGER,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            palette_id: {
                type: Sequelize.DataTypes.UUID,
                references: {
                    model: "palettes",
                    key: "id",
                },
            },
            is_active: {
                type: Sequelize.DataTypes.BOOLEAN,
                defaultValue: false,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("user_palettes");
    },
};
