'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('inventories', { 
        id: {
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.DataTypes.INTEGER,
        },
        user_id: {
            type: Sequelize.DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        is_private: {
            type: Sequelize.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        ticket_quantity: {
            type: Sequelize.DataTypes.INTEGER,
        }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('inventories');
  }
};
