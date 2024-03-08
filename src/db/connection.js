// Path: src/db/connection.js

require("dotenv").config();
const { Sequelize } = require("sequelize");
const makeRunnable = require("make-runnable/custom");

const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: "postgres",
});

console.log("Connection has been established successfully.");

const createTables = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log("All tables have been successfully created.");
  } catch (error) {
    console.error("Unable to create all tables:", error);
  } finally {
    await sequelize.close();
  }
};

const dropTables = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    await sequelize.drop();
    console.log("All tables have been successfully dropped.");
  } catch (error) {
    console.error("Unable to drop all tables:", error);
  } finally {
    await sequelize.close();
  }
};

module.exports = { sequelize, createTables, dropTables };

makeRunnable(module.exports);
