// src/models/User.js

// Import the required modules
const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection");

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
    unique: true,
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
  avatar: {
    type: DataTypes.STRING,
  },
  online: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    // set(value) {
    //   if (!value) {
    //     this.setDataValue("online", false);
    //   } else {
    //     this.setDataValue("online", value);
    //   }
    // },
  },
});

// Export User model
module.exports = User;
