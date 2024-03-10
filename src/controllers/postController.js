// src/controllers/postController.js

// Import the required modules
const Joi = require("joi");
const { User, Group, GroupUser, Event, EventUser, Post, Comment } = require("../models");
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

// Define the schema for the request body
const postSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
});

module.exports = {
  createPost: async (req, res, next) => {
    try {
      const groupId = req.params.groupId;
      const userId = req.authCheck.id;
      const { content } = req.body;

      // Execute both queries concurrently
      const [user, group] = await Promise.all([User.findByPk(userId), Group.findByPk(groupId)]);

      // Check if the group exists
      if (!group) {
        throw new NotFoundError("Group not found");
      }

      // Check if the user is a member of the group
      const isMember = await group.hasUser(user);
      if (!isMember) {
        throw new ValidationError(`User ${user.username} is not a member of group ${group.name}`, "createPost");
      }

      // Create the post
      let post;
      try {
        post = await Post.create({ content, userId, groupId });
      } catch (err) {
        throw new DatabaseError(err.message, "createPost");
      }

      // Send the response to the client
      res.status(200).json({ message: `Post successfully created by ${user.username} in group ${group.name}`, post });
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ValidationError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "createPost"));
    }
  },
};

// test
