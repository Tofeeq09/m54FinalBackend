// src/controllers/userController.js

// Import the required modules
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
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
const { Group, GroupUser, Event, EventUser, Post, Comment } = require("../models");

const postSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

module.exports = {
  signup: async (req, res, next) => {
    try {
      // Validate the request body
      const { err, value } = postSchema.validate(req.body);
      if (err) {
        let errorMessage = err.details[0].message;
        errorMessage = errorMessage.replace(/\"/g, "");
        throw new ValidationError(`Validation failed: ${errorMessage}`, "signup");
      }

      // Extract the required fields from the request body
      const { username, email, password } = value;

      // Check if the username or email already exists
      const userExists = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
      if (userExists) {
        throw new ValidationError("Validation failed: Username or Email already registered", "signup");
      }

      // Create a new user with a default avatar
      let user;
      try {
        const avatar = `https://picsum.photos/seed/${username}/200`;
        user = await User.create({
          username,
          email,
          password,
          online: true,
          avatar,
        });
      } catch (err) {
        throw new DatabaseError(err.message, "signup");
      }

      // Generate a JWT token for the user
      let token;
      try {
        token = jwt.sign({ id: user.id }, process.env.SECRET, { expiresIn: "1h" });
      } catch (err) {
        throw new JwtError(err.message, "signup");
      }

      // Extract sanitized user data and add the token
      const { password: pass, email: mail, ...rest } = user.dataValues;
      rest.authToken = token;

      // Send the response to the client
      res.status(201).json({ success: true, message: "User created successfully", user: rest });
      return;
    } catch (err) {
      if (err instanceof ValidationError || err instanceof DatabaseError || err instanceof JwtError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "signup"));
    }
  },

  login: async (req, res, next) => {
    try {
      // If GET /api/users/verify:
      if (req.authCheck) {
        // Extract sanitized user data
        const { password, email, ...rest } = req.authCheck.dataValues;

        // Send the response to the client
        res.status(200).json({ success: true, message: "User authenticated", user: rest });
        return;
      }

      // If POST /api/users/login:

      // Generate a JWT token for the user
      let token;
      try {
        token = jwt.sign({ id: req.user.id }, process.env.SECRET, { expiresIn: "8h" });
      } catch (err) {
        throw new JwtError(err.message, "login");
      }

      // Update the user's online status
      let [updateCount, [updatedUser]] = await User.update(
        { online: true },
        { where: { id: req.user.id }, returning: true }
      );

      // Extract sanitized user data and add the token
      let { password, email, ...rest } = updatedUser.dataValues;
      rest.authToken = token;

      // Send the response to the client
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

      // Execute both queries concurrently
      const [user, group] = await Promise.all([User.findByPk(userId), Group.findByPk(groupId)]);

      // Check if the group exists
      if (!group) {
        throw new NotFoundError("Group not found");
      }

      // Check if the user is already a member of the group
      const isMember = await group.hasUser(user);
      if (isMember) {
        throw new ValidationError(`User ${user.username} is already a member of group ${group.name}`, "joinGroup");
      }

      // Add the user to the group as a member
      try {
        await user.addGroup(group);
      } catch (err) {
        throw new DatabaseError(err.message, "joinGroup");
      }

      // Send the response to the client
      res.status(200).json({ message: `User ${user.username} successfully added to group ${group.name}` });
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ValidationError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "joinGroup"));
    }
  },

  logout: async (req, res, next) => {
    try {
      // Check if tokenCheck middleware was executed
      if (!req.authCheck) {
        throw new UnauthorizedError("User not authenticated", "logout");
      }

      // Update the user's online status
      try {
        await User.update({ online: false }, { where: { id: req.authCheck.id } });
      } catch (err) {
        throw new DatabaseError(err.message, "logout");
      }

      // Set the online status to false & extract sanitized user data
      req.authCheck.online = false;
      const { password, email, ...rest } = req.authCheck.dataValues;

      res.status(200).json({ success: true, message: `User ${rest.username} logged out`, user: rest });
    } catch (err) {
      if (err instanceof UnauthorizedError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "logout"));
    }
  },

  sendUpdatedUser: (req, res, next) => {
    try {
      // Check if tokenCheck middleware was executed
      if (!req.authCheck) {
        throw new UnauthorizedError("User not authenticated", "sendUpdatedUser");
      }

      if (req.isChanges === false) {
        res.status(200).json({ success: true, message: "No changes detected" });
        return;
      }

      // Extract sanitized user data
      const user = req.authCheck;
      const { password, ...rest } = user.dataValues;

      // Check if compareAndUpdateUser middleware was executed, add boolean flags to the response
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

      // Send the response to the client
      res.status(200).json({ success: true, message: "User updated", user: rest });
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "sendUpdatedUser"));
    }
  },

  getAllUsers: async (req, res, next) => {
    try {
      // Extract username from query parameters
      const username = req.query.username;
      let whereClause = {};

      // Add username to whereClause
      if (username) {
        whereClause.username = {
          [Sequelize.Op.iLike]: `%${username}%`,
        };
      }

      // Find all users and count them
      let result;
      try {
        result = await User.findAndCountAll({ where: whereClause });
      } catch (err) {
        throw new DatabaseError(err.message, "getAllUsers");
      }

      // Extract sanitized user data
      const updatedUsers = result.rows.map((user) => {
        const { password, email, ...rest } = user.dataValues;
        return rest;
      });

      if (result.count === 0) {
        throw new NotFoundError("No users found", "getAllUsers");
      }

      // Send the response to the client
      res.status(200).json({ success: true, count: result.count, users: updatedUsers });
      return;
    } catch (err) {
      if (err instanceof DatabaseError || err instanceof NotFoundError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "getAllUsers"));
    }
  },

  getUser: async (req, res, next) => {
    try {
      // Find the user by the id in the request parameters
      let user;
      try {
        user = await User.findByPk(req.params.userId);
      } catch (err) {
        throw new DatabaseError(err.message, "getUser");
      }

      // Check if the user exists
      if (!user) {
        throw new NotFoundError("User not found", "getUser");
      }

      // Extract sanitized user data
      const { password, email, ...rest } = user.dataValues;

      // Send the response to the client
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
      // Find the user by the id in the request parameters
      const { userId } = req.params;
      let user;
      try {
        user = await User.findByPk(userId);
      } catch (err) {
        throw new DatabaseError(err.message, "getUserGroups");
      }

      // Check if the user exists
      if (!user) {
        throw new NotFoundError("User not found", "getUserGroups");
      }

      // Find all groups that the user is a member of and count them
      let result;
      try {
        result = await Group.findAndCountAll({
          include: [
            {
              model: User,
              where: { id: userId },
              attributes: [],
              through: { attributes: [] },
            },
          ],
        });
      } catch (err) {
        throw new DatabaseError(err.message, "getUserGroups");
      }

      // Send the response to the client
      res.status(200).json({ count: result.count, groups: result.rows });
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "getUserGroups"));
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      // Check if tokenCheck middleware was executed
      if (!req.authCheck) {
        throw new ValidationError("User not authenticated", "deleteUser");
      }

      // Delete the user
      try {
        await req.authCheck.destroy();
      } catch (err) {
        throw new DatabaseError(err.message, "deleteUser");
      }

      // Send the response to the client
      res.status(204).end();
    } catch (err) {
      if (err instanceof ValidationError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "deleteUser"));
    }
  },

  leaveGroup: async (req, res, next) => {
    try {
      // Check if tokenCheck middleware was executed
      if (!req.authCheck) {
        throw new ValidationError("User not authenticated", "deleteUser");
      }

      const groupId = req.params.groupId;
      const userId = req.authCheck.id;

      // Find user and their role in the group concurrently
      const [user, group] = await Promise.all([
        User.findByPk(userId),
        Group.findByPk(groupId, {
          include: {
            model: User,
            as: "Users",
            where: { id: userId },
            through: { attributes: ["role"] },
            required: false,
          },
        }),
      ]);

      // Check if the user exists
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Check if the group exists
      if (!group) {
        throw new NotFoundError("Group not found");
      }

      // Check if the user is an admin of the group
      const groupUser = group.Users ? group.Users[0] : null;
      if (groupUser && groupUser.GroupUser.role === "admin") {
        throw new ValidationError(`Admin user ${user.username} cannot leave group ${group.name}`, "leaveGroup");
      }

      // Check if the user is a member of the group
      if (!groupUser) {
        throw new ValidationError(`User ${user.username} is not a member of group ${group.name}`, "leaveGroup");
      }

      // Remove the user from the group
      try {
        await user.removeGroup(group);
      } catch (err) {
        throw new DatabaseError(err.message, "leaveGroup");
      }

      // Send the response to the client
      res.status(200).json({ message: `User ${user.username} successfully removed from group ${group.name}` });
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ValidationError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "leaveGroup"));
    }
  },

  getUserEvents: async (req, res, next) => {
    try {
      // Find the user by the id in the request parameters
      const { userId } = req.params;
      let user;
      try {
        user = await User.findByPk(userId);
      } catch (err) {
        throw new DatabaseError(err.message, "getUserEvents");
      }

      // Check if the user exists
      if (!user) {
        throw new NotFoundError("User not found", "getUserEvents");
      }

      // Find all events that the user is a member of and count them
      let result;
      try {
        result = await Event.findAndCountAll({
          include: [
            {
              model: User,
              where: { id: userId },
              attributes: [],
              through: { attributes: [] },
            },
          ],
        });
      } catch (err) {
        throw new DatabaseError(err.message, "getUserEvents");
      }

      // Send the response to the client
      res.status(200).json({ count: result.count, events: result.rows });
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "getUserEvents"));
    }
  },

  attendEvent: async (req, res, next) => {
    try {
      const eventId = req.params.eventId;
      const userId = req.authCheck.id;

      // Execute both queries concurrently
      const [user, event] = await Promise.all([User.findByPk(userId), Event.findByPk(eventId)]);

      // Check if the event exists
      if (!event) {
        throw new NotFoundError("Event not found");
      }

      // Check if the user is already attending the event
      const isAttending = await event.hasUser(user);
      if (isAttending) {
        throw new ValidationError(`User ${user.username} is already attending event ${event.name}`, "attendEvent");
      }

      // Schedule the user to attend the event
      try {
        await user.addEvent(event);
      } catch (err) {
        throw new DatabaseError(err.message, "attendEvent");
      }

      // Send the response to the client
      res.status(200).json({ message: `User ${user.username} successfully scheduled to attend event ${event.name}` });
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ValidationError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "attendEvent"));
    }
  },

  cancelEventAttendance: async (req, res, next) => {
    try {
      // Check if tokenCheck middleware was executed
      if (!req.authCheck) {
        throw new ValidationError("User not authenticated", "cancelEventAttendance");
      }

      const eventId = req.params.eventId;
      const userId = req.authCheck.id;

      // Find user and their role in the event concurrently
      const [user, event] = await Promise.all([
        User.findByPk(userId),
        Event.findByPk(eventId, {
          include: {
            model: User,
            as: "Users",
            where: { id: userId },
            through: { attributes: [] },
            required: false,
          },
        }),
      ]);

      // Check if the user exists
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Check if the event exists
      if (!event) {
        throw new NotFoundError("Event not found");
      }

      // Check if the user is attending the event
      const eventUser = event.Users ? event.Users[0] : null;
      if (!eventUser) {
        throw new ValidationError(
          `User ${user.username} is not attending event ${event.name}`,
          "cancelEventAttendance"
        );
      }

      // Remove the user from the event
      try {
        await user.removeEvent(event);
      } catch (err) {
        throw new DatabaseError(err.message, "cancelEventAttendance");
      }

      // Send the response to the client
      res
        .status(200)
        .json({ message: `User ${user.username} successfully canceled attendance to event ${event.name}` });
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ValidationError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "cancelEventAttendance"));
    }
  },
};
