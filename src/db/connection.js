// Path: src/db/connection.js

require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: "postgres",
});

console.log("Connection has been established successfully.");

module.exports = sequelize;
