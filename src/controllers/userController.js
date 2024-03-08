// src/controllers/userController.js

// Import the required modules
const Joi = require("joi");
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
  ConflictError,
  RateLimitError,
  NotImplementedError,
} = require("../utils/errorHandler");
const { Group } = require("../models");

const postSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const putSchema = Joi.object({
  isUsernameMatch: Joi.boolean().required(),
  isEmailMatch: Joi.boolean().required(),
  isPasswordMatch: Joi.boolean().required(),
  isAvatarMatch: Joi.boolean().required(),
}).unknown(true);

module.exports = {
  signup: async (req, res, next) => {
    try {
      const { error, value } = postSchema.validate(req.body);
      if (error) {
        let errorMessage = error.details[0].message;
        errorMessage = errorMessage.replace(/\"/g, "");
        throw new ValidationError(`Validation failed: ${errorMessage}`, "signup");
      }

      const { username, email, password } = value;

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
        });
      } catch (err) {
        throw new DatabaseError(err.message, "signup");
      }

      try {
        user.avatar = `https://picsum.photos/seed/${user.id}/200`;
        await user.save();
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
      if (error instanceof ValidationError || error instanceof DatabaseError || error instanceof JwtError) {
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
        token = jwt.sign({ id: req.user.id }, process.env.SECRET, { expiresIn: "8h" });
      } catch (err) {
        throw new JwtError(err.message, "login");
      }

      await User.update({ online: true }, { where: { id: req.user.id } });
      let onlineUser = await User.findOne({ where: { id: req.user.id } });
      let { password, email, ...rest } = onlineUser.dataValues;
      rest.authToken = token;

      res.status(201).json({ success: true, message: "Login successful", user: rest });
      return;
    } catch (err) {
      if (err instanceof JwtError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "login"));
    }
  },

  joinGroup: async (req, res, next) => {
    try {
      const groupId = req.params.groupId;
      const userId = req.authCheck.id;

      const user = await User.findByPk(userId);
      const group = await Group.findByPk(groupId);

      // Check if the user and group exist
      if (!user) {
        throw new NotFoundError("User not found");
      }
      if (!group) {
        throw new NotFoundError("Group not found");
      }

      // Check if the user is already a member of the group
      const isMember = await group.hasUser(user);
      if (isMember) {
        throw new ValidationError(`User ${user.username} is already a member of group ${group.name}`, "joinGroup");
      }

      try {
        await user.addGroup(group);
      } catch (err) {
        throw new DatabaseError(err.message, "joinGroup");
      }

      res.status(200).json({ message: `User ${user.username} successfully added to group ${group.name}` });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof DatabaseError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "joinGroup"));
    }
  },

  logout: async (req, res, next) => {
    try {
      if (!req.authCheck) {
        throw new UnauthorizedError("User not authenticated", "logout");
      }

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
      } else {
        throw new NotFoundError("User not found", "logout");
      }
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof CustomError
      ) {
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

      const user = req.authCheck;
      const { password, ...rest } = user.dataValues;

      if (!req.authCheck.isUsernameMatch) {
        rest.usernameChanged = true;
      }
      if (!req.authCheck.isEmailMatch) {
        rest.emailChanged = true;
      }
      if (!req.authCheck.isPasswordMatch) {
        rest.passwordChanged = true;
      }
      if (!req.authCheck.isAvatarMatch) {
        rest.avatarChanged = true;
      }

      res.status(200).json({ success: true, message: "User updated", user: rest });
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError || error instanceof ValidationError) {
        next(error);
        return;
      }
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
      let user;
      try {
        user = await User.findByPk(req.params.userId);
      } catch (err) {
        throw new DatabaseError(err.message, "getUser");
      }
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

      let user;
      try {
        user = await User.findByPk(userId);
      } catch (err) {
        throw new DatabaseError(err.message, "getUserGroups");
      }

      if (!user) {
        throw new NotFoundError("User not found", "getUserGroups");
      }

      let groups;
      try {
        groups = await user.getGroups();
      } catch (err) {
        throw new DatabaseError(err.message, "getUserGroups");
      }

      res.status(200).json(groups);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "getUserGroups"));
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      if (!req.authCheck) {
        throw new ValidationError("User not authenticated", "deleteUser");
      }

      try {
        await req.authCheck.destroy();
      } catch (err) {
        throw new DatabaseError(err.message, "deleteUser");
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
