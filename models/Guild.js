'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Guild extends Model {
    static associate(models) {
      // define association here
    }

    togglePrefixStatus() {
      this.prefix_status = !this.prefix_status; 
      this.save();

      return [this, this.prefix_status]
    }
  }

  Guild.init({
    server_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    prefix: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    }, 
    prefix_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    sequelize,
    modelName: 'Guild',
  });

  return Guild;
};
