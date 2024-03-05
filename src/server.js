// Path: src/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// const connection = require("./db/connection");

const port = process.env.PORT || 5001;

const app = express();
const apiRouter = express.Router();
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api", apiRouter);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

app.listen(port, () => {
  //   connection();
  console.log(`Server is running on port ${port}`);
});
