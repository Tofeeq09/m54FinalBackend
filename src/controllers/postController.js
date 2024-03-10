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
  eventId: Joi.number().optional(),
});

module.exports = {
  createPost: async (req, res, next) => {
    // Validate request body
    const { error, value } = postSchema.validate(req.body);
    if (error) {
      let errorMessage = error.details[0].message;
      errorMessage = errorMessage.replace(/\"/g, "");
      throw new ValidationError(`Validation failed: ${errorMessage}`, "createPost");
    }

    try {
      const groupId = req.params.groupId;
      const userId = req.authCheck.id;
      const { content, eventId } = value; // !Optional eventId

      // Execute both queries concurrently
      const [user, group] = await Promise.all([User.findByPk(userId), Group.findByPk(groupId)]);

      // Check if group exists
      if (!group) {
        throw new NotFoundError("Group not found");
      }

      // Check if user is a member of group
      const isMember = await group.hasUser(user);
      if (!isMember) {
        throw new ValidationError(`User ${user.username} is not a member of group ${group.name}`, "createPost");
      }

      // If eventId is provided, check if event exists and user is member of event
      let event;
      if (eventId) {
        event = await Event.findByPk(eventId);
        if (!event) {
          throw new NotFoundError("Event not found");
        }
        const isEventMember = await event.hasUser(user);
        if (!isEventMember) {
          throw new ValidationError(`User ${user.username} is not a member of event ${event.name}`, "createPost");
        }
      }

      // Create post
      let post;
      try {
        post = await Post.create({ content, UserId: userId, GroupId: groupId, EventId: eventId });
      } catch (err) {
        throw new DatabaseError(err.message, "createPost");
      }

      // Send response to client
      res.status(200).json({ message: `Post successfully created by ${user.username} in group ${group.name}`, post });
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ValidationError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "createPost"));
    }
  },

  getGroupPosts: async (req, res, next) => {
    try {
      const groupId = req.params.groupId;

      // Find posts if groupId and no EventId
      const posts = await Post.findAll({
        where: {
          GroupId: groupId,
          EventId: null,
        },
        include: [
          {
            model: User,
            attributes: ["id", "username", "avatar"],
          },
        ],
      });

      // Check if posts exist
      if (!posts) {
        throw new NotFoundError("No posts found");
      }

      // Send response to client
      res.status(200).json({ posts });
    } catch (err) {
      next(new CustomError(err.message, 500, "getGroupPosts"));
    }
  },

  getEventPosts: async (req, res, next) => {
    try {
      const groupId = req.params.groupId;
      const eventId = req.params.eventId;

      // Find posts if groupId and eventId
      const posts = await Post.findAll({
        where: {
          GroupId: groupId,
          EventId: eventId,
        },
        include: [
          {
            model: User,
            attributes: ["id", "username", "avatar"],
          },
        ],
      });

      // Check if posts exist
      if (!posts) {
        throw new NotFoundError("No posts found");
      }

      // Send response to client
      res.status(200).json({ posts });
    } catch (err) {
      next(new CustomError(err.message, 500, "getEventPosts"));
    }
  },

  deletePost: async (req, res, next) => {
    try {
      const postId = req.params.postId;
      const userId = req.authCheck.id;

      // Find post
      const post = await Post.findByPk(postId);

      // Check if post exists
      if (!post) {
        throw new NotFoundError("Post not found");
      }

      // Find user
      const user = await User.findByPk(userId);

      // Check if user is the author or an admin
      if (post.UserId !== userId && user.role !== "admin") {
        throw new ForbiddenError("You are not authorized to delete this post");
      }

      // Delete post
      await post.destroy();

      // Send response to client
      res.status(200).json({ message: "Post successfully deleted" });
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "deletePost"));
    }
  },
};
