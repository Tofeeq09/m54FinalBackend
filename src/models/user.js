// src/models/User.js

// Import the required modules
const { DataTypes } = require("sequelize");
const sequelize = require("../db/connection");

// Define User model
const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  profile_photo: {
    type: DataTypes.STRING,
  },
});

// Export User model
module.exports = User;
