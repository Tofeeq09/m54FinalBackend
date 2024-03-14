// src/models/Follow.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection");

// Follow model
const Follow = sequelize.define(
  "Follow",
  {
    UserId: {
      type: DataTypes.INTEGER,
      references: {
        model: "Users",
        key: "id",
      },
    },
    FollowingId: {
      type: DataTypes.INTEGER,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Follow;
