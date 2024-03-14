// Path: src/server.js

require("dotenv").config();
const express = require("express"); // https://expressjs.com/en/resources/middleware.html
const cors = require("cors"); // https://www.npmjs.com/package/cors
const cookieParser = require("cookie-parser"); // https://www.npmjs.com/package/cookie-parser
const morgan = require("morgan"); // https://www.npmjs.com/package/morgan
// const rateLimit = require("express-rate-limit"); // https://www.npmjs.com/package/express-rate-limit
const { handleError, RateLimitError } = require("./utils/errorHandler");
const { sequelize } = require("./db/connection");
const {
  userRoutes,
  groupRoutes,
  eventRoutes,
  postRoutes,
  followRoutes,
} = require("./routes");
const models = require("./models");

const app = express();
const port = process.env.PORT || 5001;

const tableNames = Object.values(models).map((model) => model.tableName);
const tableNamesString = tableNames.join(", ");

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // 100 requests per windowMs
//   handler: function (req, res, next) {
//     next(new RateLimitError("Too many requests", "RateLimit"));
//   },
// });

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
// app.use(limiter);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/follow", followRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "API is live" });
  return;
});

app.get("/api/validTopics", (req, res) => {
  const validTopics = [
    "Gaming",
    "Comics/Manga",
    "Movies & TV",
    "Coding",
    "TTRPG",
  ];
  res.json(validTopics);
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
