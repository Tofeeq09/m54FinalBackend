// Path: src/db/connection.js

const mongoose = require("mongoose");

const connection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to ${mongoose.connection.name} database`);
  } catch (error) {
    console.error("Error connecting to database: ", error);
  }
};

module.exports = connection;
