// src/models/EventUser.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection");

const EventUser = sequelize.define("EventUser", {
  role: {
    type: DataTypes.ENUM("organizer", "attendee"),
    allowNull: false,
    defaultValue: "attendee",
  },
});

module.exports = EventUser;
