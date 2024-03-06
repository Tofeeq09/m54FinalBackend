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
  avatar: {
    type: DataTypes.STRING,
  },
  online: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

// Add a hook to the User model
User.afterCreate(async (user, options) => {
  user.profile_photo = `https://picsum.photos/seed/${user.id}/200`;
  await user.save();
});

// Export User model
module.exports = User;
