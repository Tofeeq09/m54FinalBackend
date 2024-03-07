// src/middleware/verify.js

// Import the required modules
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { ValidationError, JwtError, DatabaseError, CustomError } = require("../utils/errorHandler");

// Define the tokenCheck middleware

const tokenCheck = async (req, res, next) => {
  try {
    if (!req.header("Authorization")) {
      throw new ValidationError("Validation failed: No token passed", "tokenCheck");
    }

    let decodedToken;
    try {
      const token = req.header("Authorization").replace("Bearer ", "");
      decodedToken = jwt.verify(token, process.env.SECRET);
    } catch (err) {
      throw new JwtError(err.message, "tokenCheck");
    }

    let user;
    try {
      user = await User.findOne({ where: { id: decodedToken.id } });
    } catch (err) {
      throw new DatabaseError(err.message, "tokenCheck");
    }

    if (!user) {
      throw new ValidationError("Validation failed: User not authenticated", "tokenCheck");
    }

    req.user = user; // Changed from req.authCheck = user;
    next();
  } catch (err) {
    if (err instanceof ValidationError || err instanceof JwtError || err instanceof DatabaseError) {
      next(err);
    }
    next(new CustomError(err.message, 500, "tokenCheck"));
  }
};

// Export the tokenCheck middleware
module.exports = tokenCheck;