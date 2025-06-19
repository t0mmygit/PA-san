"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.renameTable(
            "user_palettes",
            "user_palettes_backup"
        );

        await queryInterface.createTable("user_palettes", {
            user_id: {
                type: Sequelize.DataTypes.INTEGER,
                references: {
                    model: "users",
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            palette_id: {
                type: Sequelize.DataTypes.UUID,
                references: {
                    model: "palettes",
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            is_active: {
                type: Sequelize.DataTypes.BOOLEAN,
                defaultValue: false,
            },
        });

        await queryInterface.sequelize.query(`
    INSERT INTO user_palettes (user_id, palette_id, is_active)
    SELECT user_id, palette_id, is_active FROM user_palettes_backup;
  `);

        await queryInterface.dropTable("user_palettes_backup");
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.renameTable(
            "user_palettes",
            "user_palettes_cascade"
        );

        await queryInterface.createTable("user_palettes", {
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            palette_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: "palettes",
                    key: "id",
                },
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
        });

        await queryInterface.sequelize.query(`
    INSERT INTO user_palettes (user_id, palette_id, is_active)
    SELECT user_id, palette_id, is_active FROM user_palettes_cascade;
  `);

        await queryInterface.dropTable("user_palettes_cascade");
    },
};
