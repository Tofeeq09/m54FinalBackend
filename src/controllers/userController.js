// src/controllers/userController.js

// Import the required modules
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User } = require("../models");
const {
  CustomError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  DatabaseError,
  BcryptError,
  JwtError,
} = require("../utils/errorHandler");

module.exports = {
  signup: async (req, res, next) => {
    try {
      const { username, email, password } = req.body;

      const userExists = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
      if (userExists) {
        throw new ValidationError("Validation failed: Username or Email already registered", "signup");
      }

      let user;
      try {
        user = await User.create({
          username,
          email,
          password,
          online: true,
          avatar: `https://picsum.photos/seed/${username}/200`,
        });
      } catch (err) {
        throw new DatabaseError(err.message, "signup");
      }

      let token;
      try {
        token = jwt.sign({ id: user.id }, process.env.SECRET, { expiresIn: "1h" });
      } catch (err) {
        throw new JwtError(err.message, "signup");
      }

      const { password: pass, email: mail, ...rest } = user.dataValues;
      rest.authToken = token;

      res.status(201).json({ success: true, message: "User created successfully", user: rest });
      return;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "signup"));
    }
  },

  login: async (req, res, next) => {
    try {
      if (req.authCheck) {
        const { password, email, ...rest } = req.authCheck.dataValues;
        res.status(200).json({ success: true, message: "User authenticated", user: rest });
        return;
      }

      let token;
      try {
        token = jwt.sign({ id: req.user.id }, process.env.SECRET, { expiresIn: "1h" });
      } catch (err) {
        throw new JwtError(err.message, "login");
      }

      await User.update({ online: true }, { where: { id: req.user.id } });
      const onlineUser = await User.findOne({ where: { id: req.user.id } });
      const { password, email, ...rest } = onlineUser.dataValues;

      rest.authToken = token;

      res.status(201).json({ success: true, message: "Login successful", user: rest });
      return;
    } catch (err) {
      if (err instanceof JwtError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "login"));
    }
  },

  joinGroup: async (req, res, next) => {
    try {
      const { userId, groupId } = req.params;

      // Fetch the user and group from the database
      const user = await User.findByPk(userId);
      const group = await Group.findByPk(groupId);

      // Check if the user and group exist
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      // Add the user to the group
      await user.addGroup(group);

      res.status(200).json({ message: "User successfully added to group" });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      let user;
      try {
        user = await User.findByPk(req.authCheck.id);
      } catch (err) {
        throw new DatabaseError(err.message, "logout");
      }
      if (user) {
        await user.update({ online: false });
        res.status(200).json({ success: true, message: "User logged out", user });
        return;
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof DatabaseError || error instanceof CustomError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "logout"));
    }
  },

  sendUpdatedUser: (req, res, next) => {
    try {
      if (!req.authCheck) {
        throw new UnauthorizedError("User not authenticated", "sendUpdatedUser");
      }

      if (req.authCheck.id.toString() !== req.params.id) {
        throw new ForbiddenError("User not authorized", "sendUpdatedUser");
      }

      console.log("isUsernameMatch:", req.authCheck.isUsernameMatch);

      const user = req.authCheck;
      const { password, ...rest } = user.dataValues;

      if (!req.authCheck.isUsernameMatch && req.authCheck.id.toString() === req.params.id) {
        rest.usernameChanged = true;
      }
      if (!req.authCheck.isEmailMatch && req.authCheck.id.toString() === req.params.id) {
        rest.emailChanged = true;
      }
      if (!req.authCheck.isPasswordMatch && req.authCheck.id.toString() === req.params.id) {
        rest.passwordChanged = true;
      }
      if (!req.authCheck.isAvatarMatch && req.authCheck.id.toString() === req.params.id) {
        rest.avatarChanged = true;
      }

      res.status(200).json({ success: true, message: "User updated", user: rest });
    } catch (error) {
      next(new CustomError(error.message, 500, "sendUpdatedUser"));
    }
  },

  getAllUsers: async (req, res, next) => {
    try {
      let users;
      try {
        users = await User.findAll();
      } catch (err) {
        throw new DatabaseError(err.message, "getAllUsers");
      }
      const updatedUsers = users.map((user) => {
        const { password, email, ...rest } = user.dataValues;
        return rest;
      });
      res.status(200).json({ success: true, users: updatedUsers });
      return;
    } catch (error) {
      if (error instanceof DatabaseError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "getAllUsers"));
    }
  },

  getUser: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        throw new NotFoundError("User not found", "getUser");
      }

      const { password, email, ...rest } = user.dataValues;
      res.status(200).json({ success: true, user: rest });
    } catch (err) {
      if (err instanceof ValidationError || err instanceof DatabaseError || err instanceof NotFoundError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "getUser"));
    }
  },

  getUserGroups: async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Fetch the user from the database
      const user = await User.findByPk(userId);

      // Check if the user exists
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get the groups of the user
      const groups = await user.getGroups();

      res.status(200).json(groups);
    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      if (!req.authCheck) {
        throw new ValidationError("User not authenticated", "updateUser");
      }

      try {
        await req.authCheck.destroy();
      } catch (err) {
        throw new CustomError("Error while deleting user", 500, "deleteUser");
      }

      res.status(204).end();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "deleteUser"));
    }
  },
};
