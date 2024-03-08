// src/models/EventUser.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection");

const EventUser = sequelize.define("EventUser", {
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "attendee",
    validate: {
      isIn: {
        args: [["organizer", "attendee"]],
        msg: "Role must be one of: 'organizer', 'attendee'",
      },
    },
  },
});

module.exports = EventUser;
