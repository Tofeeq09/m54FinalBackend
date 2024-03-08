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
const { GroupUser } = require("../models");

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
        return;
      }
      next(new CustomError(error.message, 500, "hashPassword"));
    }
  },

  validate: async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      console.log(username, email, password);
      if (!username && !email) {
        throw new ValidationError("Validation failed: Username or Email is required", "validate");
      }

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

      if (!user) {
        throw new NotFoundError("User not found", "findUser");
      }

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
            throw new DatabaseError(err.message, "compareAndUpdateUser");
          }
        }

        // Send updated user to the next middleware
        next();
        return;
      }

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
      let isMatch;
      // req.authCheck is set in the tokenCheck middleware
      // req.user is set in the findUser middleware
      const user = req.authCheck || req.user;

      if (!user) {
        throw new UnauthorizedError("User not authenticated", "comparePass");
      }

      if (!req.body.password) {
        throw new ValidationError("Password is required", "comparePass");
      }

      try {
        isMatch = await bcrypt.compare(req.body.password, user.password);
      } catch (err) {
        throw new BcryptError(err.message, "comparePass");
      }

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

      let groupUser;
      try {
        groupUser = await GroupUser.findOne({
          where: {
            UserId: userId,
            GroupId: groupId,
          },
        });
      } catch (err) {
        throw new DatabaseError(err.message, "adminCheck");
      }

      if (!groupUser) {
        throw new NotFoundError("User not found in group", "adminCheck");
      }

      if (groupUser.role !== "admin") {
        throw new ForbiddenError("User is not an admin", "adminCheck");
      }

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
};
