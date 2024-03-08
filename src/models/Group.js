// src/models/Group.js

// Import the required modules
const { DataTypes } = require("sequelize");
const sequelize = require("../db/connection");

// Define Group model
const Group = sequelize.define("Group", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  topics: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
  privacy_settings: {
    type: DataTypes.STRING,
  },
});

// Export Group model
module.exports = Group;
