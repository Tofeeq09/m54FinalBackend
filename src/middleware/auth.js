// src/middleware/auth.js

// Import the required modules
const Joi = require("joi");
const bcrypt = require("bcrypt");
const saltRounds = parseInt(process.env.SALT_ROUNDS);
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
const { GroupUser, Group, EventUser, Event } = require("../models");

const userUpdateSchema = Joi.object({
  username: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  avatar: Joi.string().optional(),
}).unknown(true);

// Define the auth middleware

module.exports = {
  hashPassword: async (req, res, next) => {
    try {
      // Extract password from request body
      const { password } = req.body;

      // Check if password is provided
      if (!password) {
        throw new ValidationError("Validation failed: password is required", "hashPassword");
      }

      // Hash the password
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(password, saltRounds);
      } catch (err) {
        throw new BcryptError(err.message, "hashPassword");
      }

      // Replace password in req.body with hashed password
      req.body.password = hashedPassword;

      next();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BcryptError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "hashPassword"));
    }
  },

  validate: async (req, res, next) => {
    try {
      // Extract required fields from request body
      const { username, email, password } = req.body;

      // Check if username or email is provided
      if (!username && !email) {
        throw new ValidationError("Validation failed: Username or Email is required", "validate");
      }

      // Check if password is provided
      if (!password) {
        throw new ValidationError("Validation failed: Password is required", "validate");
      }

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "validate"));
    }
  },

  findUser: async (req, res, next) => {
    try {
      // Find user by username or email depending on what provided
      const whereClause = {};
      if (req.body.username) whereClause.username = req.body.username;
      if (req.body.email) whereClause.email = req.body.email;
      let user;
      try {
        user = await User.findOne({
          where: whereClause,
        });
      } catch (err) {
        throw new DatabaseError(err.message, "findUser");
      }

      // Check if user is not found
      if (!user) {
        throw new NotFoundError("User not found", "findUser");
      }

      // Attach sequelize user object to the request object
      req.user = user;

      next();
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "findUser"));
    }
  },

  compareAndUpdateUser: async (req, res, next) => {
    try {
      // Validate request body
      const { error, value } = userUpdateSchema.validate(req.body);
      if (error) {
        let errorMessage = error.details[0].message;
        errorMessage = errorMessage.replace(/\"/g, "");
        throw new ValidationError(`Validation failed: ${errorMessage}`, "signup");
      }

      // If user is authenticated do this...
      if (req.authCheck) {
        const user = req.authCheck;

        // Update user's properties
        user.username = value.username || user.username;
        user.email = value.email || user.email;
        user.avatar = value.avatar || user.avatar;

        if (value.password) {
          try {
            // Check if password has been changed
            const isMatch = await bcrypt.compare(value.password, user.password);
            if (!isMatch) {
              // Hash new password
              user.password = await bcrypt.hash(value.password, saltRounds);
            }
          } catch (err) {
            throw new BcryptError(err.message, "compareAndUpdateUser");
          }
        }

        // Check which properties have been changed
        req.authCheck.isUsernameMatch = !user.changed("username");
        req.authCheck.isEmailMatch = !user.changed("email");
        req.authCheck.isPasswordMatch = !user.changed("password");
        req.authCheck.isAvatarMatch = !user.changed("avatar");

        // Save changes to database only if any field has changed
        if (user.changed()) {
          try {
            await user.save();
          } catch (err) {
            // If username or email is already in use
            if (err.name === "SequelizeUniqueConstraintError") {
              const fields = err.errors.map((error) => error.path);
              if (fields.includes("username")) {
                throw new ValidationError("Username is already in use", "compareAndUpdateUser");
              }
              if (fields.includes("email")) {
                throw new ValidationError("Email is already in use", "compareAndUpdateUser");
              }
            }
            throw new DatabaseError(err.message, "compareAndUpdateUser");
          }
        }

        next();
        return;
      }
      // If user is not authenticated do this...
      next();
    } catch (err) {
      if (err instanceof ValidationError || err instanceof BcryptError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "compareAndUpdateUser"));
    }
  },

  comparePassword: async (req, res, next) => {
    try {
      // req.authCheck is assigned in tokenCheck middleware
      // req.user is assigned in findUser middleware
      const user = req.authCheck || req.user;

      // Check if user is authenticated
      if (!user) {
        throw new UnauthorizedError("User not authenticated", "comparePass");
      }

      // Check if password is provided
      if (!req.body.password) {
        throw new ValidationError("Password is required", "comparePass");
      }

      // Compare password
      let isMatch;
      try {
        isMatch = await bcrypt.compare(req.body.password, user.password);
      } catch (err) {
        throw new BcryptError(err.message, "comparePass");
      }

      // Check if password is incorrect
      if (!isMatch) {
        throw new UnauthorizedError("The password you entered is incorrect. Please try again.", "comparePass");
      }

      next();
    } catch (error) {
      if (error instanceof BcryptError || error instanceof UnauthorizedError || error instanceof ValidationError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "comparePass"));
    }
  },

  adminCheck: async (req, res, next) => {
    try {
      const userId = req.authCheck.id;
      const groupId = req.params.groupId;

      // Find group user
      let groupUser;
      try {
        groupUser = await GroupUser.findOne({
          where: {
            UserId: userId,
            GroupId: groupId,
          },
          include: Group,
        });
      } catch (err) {
        throw new DatabaseError(err.message, "adminCheck");
      }

      // Check if user is in group
      if (!groupUser) {
        throw new NotFoundError("Group not found or user not in group", "adminCheck");
      }

      // Attach sequelize group object to req object & set isAdmin to true
      req.group = groupUser.Group;
      req.isAdmin = true;
      next();
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof NotFoundError || error instanceof DatabaseError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "adminCheck"));
    }
  },

  groupCheck: async (req, res, next) => {
    // Find group by id
    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId);

    // Check if group is not found
    if (!group) {
      next(new NotFoundError("Group not found"));
      return;
    }

    // Attach sequelize group object to request object
    req.group = group;

    next();
  },

  organizerCheck: async (req, res, next) => {
    try {
      const userId = req.authCheck.id;
      const eventId = req.params.eventId;

      // Find event user
      let eventUser;
      try {
        eventUser = await EventUser.findOne({
          where: {
            UserId: userId,
            EventId: eventId,
          },
          include: Event,
        });
      } catch (err) {
        throw new DatabaseError(err.message, "organizerCheck");
      }

      // Check if event is organized or user is an attendee
      if (!eventUser) {
        throw new NotFoundError("Event not found or user not an organizer", "organizerCheck");
      }

      // Check if user is an organizer
      if (eventUser.role !== "organizer") {
        throw new ForbiddenError("User is not an organizer", "organizerCheck");
      }

      // Attach the event to req object & set isOrganizer to true
      req.event = eventUser.Event;
      req.isOrganizer = true;

      next();
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof NotFoundError || error instanceof DatabaseError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "organizerCheck"));
    }
  },
};
