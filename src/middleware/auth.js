// src/middleware/auth.js

// Import the required modules
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const { User } = require("../models");
const { ValidationError, CustomError } = require("../utils/errorHandler");

// Define the auth middleware
const hashPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      throw new ValidationError("Validation failed: password is required", "hashPassword");
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    req.body.password = hashedPassword;

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      next(error);
    }

    next(new CustomError(error.message, 500, "hashPassword"));
  }
};

module.exports = { hashPassword };
