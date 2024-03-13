// src/models/Friendship.js

// Import the required modules
const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection");

// Define Friendship model
// Define Friendship model
const Friendship = sequelize.define(
  "Friendship",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    friendId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["userId", "friendId"],
      },
    ],
  }
);

// Export Friendship model
module.exports = Friendship;
