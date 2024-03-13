// src/models/GroupUser.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection");

const GroupUser = sequelize.define("GroupUser", {
  role: {
    type: DataTypes.ENUM("member", "admin"),
    allowNull: false,
    defaultValue: "member",
  },
});

module.exports = GroupUser;
