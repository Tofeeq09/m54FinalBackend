// src/models/Event.js

// Import the required modules
const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection");

// Define Event model
const Event = sequelize.define("Event", {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
  },
});

// Export Event model
module.exports = Event;
