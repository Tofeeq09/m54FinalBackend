// Path: src/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { sequelize } = require("./db/connection");
const models = require("./models");
const { handleError } = require("./utils/errorHandler");
const { userRoutes, groupRoutes } = require("./routes");
const { RateLimitError } = require("./utils/errorHandler");

const app = express();
const port = process.env.PORT || 5001;

const tableNames = Object.values(models).map((model) => model.tableName);
const tableNamesString = tableNames.join(", ");

// https://www.npmjs.com/package/express-rate-limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  handler: function (req, res, next) {
    next(new RateLimitError("Too many requests", "RateLimit"));
  },
});

app.use(cors());
app.use(express.json());
app.use(limiter);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "API is live" });
  return;
});

const syncDatabase = async () => {
  try {
    await sequelize.sync();
    console.log(
      `Database: ${sequelize.getDialect()}, Database Name: ${
        sequelize.config.database
      }, Tables Created: ${tableNamesString}`
    );
  } catch (error) {
    console.error("Error while syncing the database", error);
  }
};

app.use(handleError);

app.listen(port, () => {
  syncDatabase();
  console.log(`Server is live on http://localhost:${port}`);
});
