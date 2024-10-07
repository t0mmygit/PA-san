'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('guilds', 'createdAt', 'created_at');
    await queryInterface.renameColumn('guilds', 'updatedAt', 'updated_at');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('guilds', 'created_at', 'createdAt');
    await queryInterface.renameColumn('guilds', 'updated_at', 'updatedAt');
  }
};