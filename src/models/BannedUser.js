// src/models/BannedUser.js

// Import the required modules
const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection");

// Define BannedUser model
const BannedUser = sequelize.define(
  "BannedUser",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["userId", "groupId"],
      },
    ],
  }
);

// Export BannedUser model
module.exports = BannedUser;
