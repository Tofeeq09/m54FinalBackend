// src/middleware/auth.js

// Import the required modules
const bcrypt = require("bcrypt");
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const User = require("../models/user");
const {
  ValidationError,
  DatabaseError,
  BcryptError,
  CustomError,
  UnauthorizedError,
} = require("../utils/errorHandler");

// Define the auth middleware

const hashPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      throw new ValidationError("Validation failed: password is required", "hashPassword");
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (err) {
      throw new BcryptError(err.message, "hashPassword");
    }

    req.body.password = hashedPassword;

    next();
  } catch (error) {
    if (error instanceof ValidationError || error instanceof BcryptError) {
      next(error);
    }
    next(new CustomError(error.message, 500, "hashPassword"));
  }
};

const findUser = async (req, res, next) => {
  try {
    let user;
    try {
      user = await User.findOne({ where: { username: req.body.username } });
    } catch (err) {
      throw new DatabaseError(err.message, "findUser");
    }

    if (!user) {
      throw new ValidationError("Validation failed: User not found", "findUser");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      next(error);
    }
    next(new CustomError(error.message, 500, "findUser"));
  }
};

const comparePassword = async (req, res, next) => {
  try {
    let isMatch;
    try {
      isMatch = await bcrypt.compare(req.body.password, req.user.password);
    } catch (err) {
      throw new BcryptError(err.message, "comparePass");
    }

    if (!isMatch) {
      throw new UnauthorizedError("Authorization failed: Incorrect password", "comparePass");
    }

    console.log("Before:", req.user.isOnline);

    req.user.isOnline = true;
    await req.user.save();
    req.user = await req.user.reload();

    console.log("After:", req.user.isOnline);

    next();
  } catch (error) {
    if (error instanceof BcryptError || error instanceof UnauthorizedError) {
      next(error);
    }
    next(new CustomError(error.message, 500, "comparePass"));
  }
};

module.exports = { findUser, hashPassword, comparePassword };
