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
  sendFriendRequest: async (req, res, next) => {
    try {
      const user = req.authCheck;
      const friendId = req.params.friendId;

      // Check if friend exists
      const friend = await User.findByPk(friendId);
      if (!friend) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if friend request already exists
      const existingRequest = await Friendship.findOne({
        where: {
          userId: user.id,
          friendId: friend.id,
        },
      });
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: "Friend request already sent",
        });
      }

      // Create friend request
      await Friendship.create({
        userId: user.id,
        friendId: friend.id,
        status: "pending",
      });

      res.status(200).json({
        success: true,
        message: "Friend request sent successfully",
      });
    } catch (error) {
      next(new CustomError(error.message, 500, "sendFriendRequest"));
    }
  },

  acceptFriendRequest: async (req, res, next) => {
    try {
      const user = req.authCheck;
      const friendId = req.params.friendId;

      // Check if friend request exists
      const friendRequest = await Friendship.findOne({
        where: {
          userId: friendId,
          friendId: user.id,
          status: "pending",
        },
      });
      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          message: "Friend request not found",
        });
      }

      // Update friend request status to 'accepted'
      await friendRequest.update({ status: "accepted" });

      res.status(200).json({
        success: true,
        message: "Friend request accepted successfully",
      });
    } catch (error) {
      next(new CustomError(error.message, 500, "acceptFriendRequest"));
    }
  },

  rejectFriendRequest: async (req, res, next) => {
    try {
      const user = req.authCheck;
      const friendId = req.params.friendId;

      // Check if friend request exists
      const friendRequest = await Friendship.findOne({
        where: {
          userId: friendId,
          friendId: user.id,
          status: "pending",
        },
      });
      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          message: "Friend request not found",
        });
      }

      // Update friend request status to 'rejected'
      await friendRequest.update({ status: "rejected" });

      res.status(200).json({
        success: true,
        message: "Friend request rejected successfully",
      });
    } catch (error) {
      next(new CustomError(error.message, 500, "rejectFriendRequest"));
    }
  },

  getAllFriends: async (req, res, next) => {
    try {
      const user = req.authCheck;

      // Get all friends
      const friends = await Friendship.findAll({
        where: {
          userId: user.id,
          status: "accepted",
        },
        include: [
          {
            model: User,
            as: "Friends",
            attributes: ["id", "username", "avatar"],
          },
        ],
      });

      res.status(200).json({
        success: true,
        data: friends,
      });
    } catch (error) {
      next(new CustomError(error.message, 500, "getAllFriends"));
    }
  },

  getFriendRequests: async (req, res, next) => {
    try {
      const user = req.authCheck;

      // Get all pending friend requests
      const friendRequests = await Friendship.findAll({
        where: {
          friendId: user.id,
          status: "pending",
        },
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "username", "avatar"],
          },
        ],
      });

      res.status(200).json({
        success: true,
        data: friendRequests,
      });
    } catch (error) {
      next(new CustomError(error.message, 500, "getFriendRequests"));
    }
  },

  unfriend: async (req, res, next) => {
    try {
      const user = req.authCheck;
      const friendId = req.params.friendId;

      // Check if friend relationship exists
      const friendship = await Friendship.findOne({
        where: {
          userId: user.id,
          friendId: friendId,
          status: "accepted",
        },
      });
      if (!friendship) {
        return res.status(404).json({
          success: false,
          message: "Friendship not found",
        });
      }

      // Delete friend relationship
      await friendship.destroy();

      res.status(200).json({
        success: true,
        message: "Unfriended successfully",
      });
    } catch (error) {
      next(new CustomError(error.message, 500, "unfriend"));
    }
  },
};
