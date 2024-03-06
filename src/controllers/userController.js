// src/controllers/userController.js

const { User } = require("../models");
const { ValidationError, DatabaseError } = require("../utils/errorHandler");

const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const usernameExists = await User.findOne({ where: { username } });
    if (usernameExists) {
      throw new ValidationError("Validation failed: Username already registered", "signup");
    }

    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      throw new ValidationError("Validation failed: Email already registered", "signup");
    }

    const user = await User.create({ username, email, password });

    res.status(201).json({ success: true, user });
    return;
  } catch (error) {
    if (error instanceof ValidationError) {
      next(error);
    }
    next(new DatabaseError(error.message, "signup"));
  }
};

module.exports = { signup };
