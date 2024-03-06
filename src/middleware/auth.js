// src/middleware/auth.js

// Import the required modules
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const { User } = require("../models");

// Define the auth middleware
const hashPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ success: false, message: "Password is required" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    req.body.password = hashedPassword;

    next();
  } catch (error) {
    res.status(500).json({ success: false, source: "hashPassword", error: error.message });
    return;
  }
};

module.exports = { hashPassword };
