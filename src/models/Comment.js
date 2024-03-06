// src/models/Comment.js

// Import the required modules
const { DataTypes } = require("sequelize");
const sequelize = require("../db/connection");

// Define Comment model
const Comment = sequelize.define("Comment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

// Export Comment model
module.exports = Comment;
