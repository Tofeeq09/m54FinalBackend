// Path: src/db/connection.js

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: "postgres",
});

sequelize.authenticate();

console.log("Connection has been established successfully.");

module.exports = sequelize;

// // script: npm run create
// require("make-runnable");
