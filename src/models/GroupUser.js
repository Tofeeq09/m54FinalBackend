// src/models/GroupUser.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection");

const GroupUser = sequelize.define("GroupUser", {
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "member",
    validate: {
      isIn: {
        args: [["member", "admin"]],
        msg: "Role must be either 'member' or 'admin'",
      },
    },
  },
});

module.exports = GroupUser;
