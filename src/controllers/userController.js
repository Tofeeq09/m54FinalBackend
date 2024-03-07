// src/controllers/userController.js

// Import the required modules
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User } = require("../models");
const { ValidationError, DatabaseError, JwtError, CustomError } = require("../utils/errorHandler");

// Define the user controller
const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
    if (userExists) {
      throw new ValidationError("Validation failed: Username or Email already registered", "signup");
    }

    let user;
    try {
      user = await User.create({ username, email, password, online: true });
      user.avatar = `https://picsum.photos/seed/${user.id}/200`;
      await user.save();
    } catch (err) {
      throw new DatabaseError(err.message, "signup");
    }

    delete user.dataValues["password"];
    delete user.dataValues["email"];

    res.status(201).json({ success: true, message: "User created successfully", user });
    return;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      next(error);
    }
    next(new CustomError(error.message, 500, "signup"));
  }
};

const login = async (req, res, next) => {
  try {
    if (req.authCheck) {
      delete req.authCheck.dataValues["password"];
      delete req.authCheck.dataValues["email"];
      res.status(200).json({ success: true, message: "User authenticated", user: req.authCheck });
      return;
    }

    let token;
    try {
      token = jwt.sign({ id: req.user.id }, process.env.SECRET, { expiresIn: "1h" });
    } catch (err) {
      throw new JwtError(err.message, "login");
    }
    const { password, ...rest } = req.user.dataValues;
    rest.authToken = token;

    res.status(201).json({ success: true, message: "Login successful", user: rest });
    return;
  } catch (err) {
    if (err instanceof JwtError) {
      next(err);
    }
    next(new CustomError(err.message, 500, "login"));
  }
};

const logout = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      throw new ValidationError("Validation failed: User not found", "logout");
    }

    user.isOnline = false;
    await user.save();
    await user.reload();

    res.status(200).json({ success: true, message: "User logged out", user: user });
    return;
  } catch (err) {
    if (err instanceof ValidationError || err instanceof DatabaseError) {
      next(err);
    }
    next(new CustomError(err.message, 500, "logout"));
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(new CustomError(err.message, 500, "getAllUsers"));
  }
};

// Export the user controller
module.exports = { signup, login, logout, getAllUsers };
