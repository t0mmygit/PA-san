'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('channels', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      discord_channel_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      guild_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'guilds',
          key: 'id',
        },
      },
      settings: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    })
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.dropTable('channeL_settings');
  }
};
