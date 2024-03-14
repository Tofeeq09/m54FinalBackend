// src/controllers/eventController.js

// Import the required modules
const {
  User,
  Group,
  GroupUser,
  Event,
  EventUser,
  Post,
  Follow,
} = require("../models");
const {
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} = require("../utils/errorHandler");
const { sequelize } = require("../db/connection");

module.exports = {
  followUser: async (req, res, next) => {
    try {
      if (!req.authCheck) {
        throw new UnauthorizedError("User not authenticated");
      }

      const targetUser = await User.findByPk(req.params.userId);
      if (!targetUser) {
        throw new NotFoundError("User not found");
      }

      if (req.authCheck.id === targetUser.id) {
        throw new UnauthorizedError("You cannot follow yourself", "followUser");
      }

      const [follow, created] = await Follow.findOrCreate({
        where: {
          UserId: req.authCheck.id,
          FollowingId: targetUser.id,
        },
      });

      if (!created) {
        throw new ConflictError(
          "You are already following this user",
          "followUser"
        );
      }

      res.status(200).send({ message: "Followed successfully" });
    } catch (err) {
      console.error(err);
      next(err);
    }
  },

  unfollowUser: async (req, res, next) => {
    try {
      if (!req.authCheck) {
        throw new UnauthorizedError("User not authenticated");
      }

      const targetUser = await User.findByPk(req.params.userId);
      if (!targetUser) {
        throw new NotFoundError("User not found");
      }

      if (req.authCheck.id === targetUser.id) {
        throw new UnauthorizedError(
          "You cannot unfollow yourself",
          "unfollowUser"
        );
      }

      const follow = await Follow.findOne({
        where: {
          UserId: req.authCheck.id,
          FollowingId: targetUser.id,
        },
      });

      if (!follow) {
        return res
          .status(409)
          .send({ message: "You are not following this user" });
      }

      await follow.destroy();
      res.status(200).send({ message: "Unfollowed successfully" });
    } catch (err) {
      console.error(err);
      next(err);
    }
  },

  getFollowData: async (req, res, next) => {
    try {
      if (!req.authCheck) {
        throw new UnauthorizedError("User not authenticated");
      }

      const user = await User.findByPk(req.params.userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const followers = await user.getFollowers({
        attributes: ["id", "username", "avatar"],
      });
      const followersCount = followers.length;
      console.log(`Followers of user ${req.params.userId}:`, followers);

      const following = await user.getFollowing({
        attributes: ["id", "username", "avatar"],
      });
      const followingCount = following.length;
      console.log(`Following of user ${req.params.userId}:`, following);

      res
        .status(200)
        .send({ followers, followersCount, following, followingCount });
    } catch (err) {
      console.error(err);
      next(err);
    }
  },
};
