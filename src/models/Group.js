// src/models/Group.js

// Import the required modules
const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection");

// Define Group model
const Group = sequelize.define("Group", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  topics: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    validate: {
      areValidTopics(value) {
        if (!value) return;
        const validTopics = ["topic1", "topic2", "topic3", "topic4", "topic5"];
        for (let topic of value) {
          if (!validTopics.includes(topic)) {
            throw new Error("Topics must be one of: 'topic1', 'topic2', 'topic3', 'topic4', 'topic5'");
          }
        }
      },
    },
  },
  privacy_settings: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [["public", "private"]],
    },
  },
});

// Export Group model
module.exports = Group;
