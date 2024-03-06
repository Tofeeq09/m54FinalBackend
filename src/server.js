// Path: src/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { createTables } = require("./db/connection");

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});
// test
app.listen(port, () => {
  createTables()
    .then(() => console.log("Tables created successfully"))
    .catch((err) => console.error("Error creating tables:", err));
  console.log(`Server is live on http://localhost:${port}`);
});
