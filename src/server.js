// Path: src/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./db/connection");
const models = require("./models"); // Load models and associations

const app = express();
const port = process.env.PORT || 5001;
const tableNames = Object.values(models).map((model) => model.tableName);
const tableNamesString = tableNames.join(", ");

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log(
      `Database: ${sequelize.getDialect()}, Database Name: ${
        sequelize.config.database
      }, Tables Created: ${tableNamesString}`
    );
  } catch (error) {
    console.error("Error while syncing the database", error);
  }
};

app.listen(port, () => {
  syncDatabase();
  console.log(`Server is live on http://localhost:${port}`);
});
