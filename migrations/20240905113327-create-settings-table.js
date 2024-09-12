'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      command: {
        type: Sequelize.DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      config: Sequelize.DataTypes.JSON,
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('settings');
  }
};