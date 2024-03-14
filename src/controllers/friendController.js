// src/controllers/friendController.js

// Import the required modules
const Joi = require("joi");
const { User, Friendship } = require("../models");
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

const schema = Joi.object({
  friendId: Joi.number().required(),
});

module.exports = {
  addFriend: async (req, res, next) => {
    try {
      const { error } = schema.validate(req.params);
      if (error) {
        let errorMessage = error.details[0].message;
        errorMessage = errorMessage.replace(/\"/g, "");
        throw new ValidationError(
          `Validation failed: ${errorMessage}`,
          "addFriend"
        );
      }

      const { friendId } = req.params;
      const userId = req.authCheck.id;

      const [friendship, created] = await Friendship.findOrCreate({
        where: {
          userId,
          friendId,
        },
      });

      if (!created) {
        throw new ValidationError("Friendship already exists", "addFriend");
      }

      res.status(201).json({
        success: true,
        message: "Friend added successfully",
        friendship,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "addFriend"));
    }
  },

  removeFriend: async (req, res, next) => {
    try {
      const { error } = schema.validate(req.params);
      if (error) {
        let errorMessage = error.details[0].message;
        errorMessage = errorMessage.replace(/\"/g, "");
        throw new ValidationError(
          `Validation failed: ${errorMessage}`,
          "removeFriend"
        );
      }

      const { friendId } = req.params;
      const userId = req.authCheck.id;

      const friendship = await Friendship.findOne({
        where: {
          userId,
          friendId,
        },
      });

      if (!friendship) {
        throw new NotFoundError("Friendship does not exist", "removeFriend");
      }

      await friendship.destroy();

      res.status(200).json({
        success: true,
        message: "Friendship removed successfully",
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "removeFriend"));
    }
  },

  getUserFriends: async (req, res, next) => {
    try {
      if (!req.authCheck) {
        throw new UnauthorizedError("Unauthorized", "getUserFriends");
      }

      const userId = req.authCheck.id;

      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError("User not found", "getUserFriends");
      }

      const friends = await user.getFriends({
        attributes: { exclude: ["email", "password"] },
      });

      res.status(200).json({
        success: true,
        message: "Friends fetched successfully",
        friends,
      });
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof UnauthorizedError
      ) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "getUserFriends"));
    }
  },
};
