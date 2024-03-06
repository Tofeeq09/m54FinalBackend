// src/models/User.js

const { DataTypes } = require("sequelize");
const sequelize = require("../db/connection");

const Group = require("./Group");

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

User.belongsToMany(Group, { through: GroupUser });
User.belongsToMany(Event, { through: EventUser });

module.exports = User;
