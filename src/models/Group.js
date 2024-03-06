// src/models/User.js

const { DataTypes } = require("sequelize");
const sequelize = require("../db/connection");

const User = require("./User");

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
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
  privacy_settings: {
    type: DataTypes.STRING,
  },
});

Group.belongsToMany(User, { through: GroupUser });
Group.hasMany(Event);

module.exports = Group;
