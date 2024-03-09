// src/controllers/groupController.js

// Import the required modules
const Joi = require("joi");
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const { User, Group, GroupUser, Event, EventUser } = require("../models");
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
const { sequelize } = require("../db/connection");

const postSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  privacy_settings: Joi.string().required(),
  topics: Joi.array().items(Joi.string()).required(),
});

const putSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(""),
  topics: Joi.array().items(Joi.string().valid("topic1", "topic2", "topic3", "topic4", "topic5")).allow(""),
  privacy_settings: Joi.string().allow(""),
}).unknown(true);

module.exports = {
  createGroup: async (req, res, next) => {
    try {
      // Check if tokenCheck middleware was executed
      if (!req.authCheck) {
        throw new ForbiddenError("Forbidden", "createGroup");
      }

      // Validate the request body
      const { err, value } = postSchema.validate(req.body);
      if (err) {
        let errorMessage = err.details[0].message;
        errorMessage = errorMessage.replace(/\"/g, "");
        throw new ValidationError(`Validation failed: ${errorMessage}`, "signup");
      }

      // Extract the required fields from the request body
      const { name, description, privacy_settings, topics } = value;

      // Check if the group already exists
      const existingGroup = await Group.findOne({ where: { name } });
      if (existingGroup) {
        throw new ValidationError("Validation failed: Group already exists", "createGroup");
      }

      // Start a new transaction
      let transaction = await sequelize.transaction();

      let group;
      try {
        // Create the group
        group = await Group.create(
          {
            name,
            description,
            topics,
            privacy_settings,
          },
          { transaction }
        );

        // Commit the transaction
        await transaction.commit();

        // Start a new transaction for adding the user to the group
        transaction = await sequelize.transaction();

        try {
          // Add the user who created the group as an admin
          const user = await User.findByPk(req.authCheck.id);
          if (user) {
            await group.addUser(user, { through: { role: "admin" } }, { transaction });
          }

          // Commit the transaction
          await transaction.commit();
          group = group.dataValues;
        } catch (err) {
          // Rollback the transaction in case of an error
          await transaction.rollback();
          throw new DatabaseError(err.message, "createGroup");
        }
      } catch (err) {
        // Rollback the transaction in case of an error
        await transaction.rollback();
        throw new DatabaseError(err.message, "createGroup");
      }

      // Send response to client
      res.status(201).json({ success: true, message: "Group created successfully", group });
      return;
    } catch (err) {
      if (err instanceof ValidationError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "createGroup"));
    }
  },

  getAllGroups: async (req, res, next) => {
    try {
      // Extract topics from query parameters
      const topics = req.query.topics ? req.query.topics.split(",") : [];
      const groupName = req.query.name;
      let whereClause = {};

      // If topics provided, filter groups to include only those matching topics
      if (topics.length > 0) {
        whereClause.topics = {
          [Sequelize.Op.overlap]: topics,
        };
      }

      // If name provided, filter groups to include only those with a name containing the provided string, case-insensitively
      if (groupName) {
        whereClause.name = {
          [Sequelize.Op.iLike]: `%${groupName}%`,
        };
      }

      // Find all groups or groups matching the query parameters /api/groups?topics=topic1,topic2&name=<name>
      let groups;
      try {
        groups = await Group.findAll({ where: whereClause });
      } catch (err) {
        throw new DatabaseError(err.message, "getAllGroups");
      }

      // If no groups found
      if (!groups) {
        throw new NotFoundError("No groups found", "getAllGroups");
      }

      // Count members in each group
      const result = await Promise.all(
        groups.map(async (group) => {
          const membersCount = await group.countUsers();
          return { ...group.get(), membersCount };
        })
      );

      if (result.length === 0) {
        throw new NotFoundError("No groups found", "getAllGroups");
      }

      // Send response to client
      res.status(200).json({ success: true, count: result.length, groups: result });
      return;
    } catch (err) {
      if (err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "getAllGroups"));
    }
  },

  getGroup: async (req, res, next) => {
    try {
      // Find the group by id
      let group;
      try {
        group = await Group.findByPk(req.params.groupId);
      } catch (err) {
        throw new DatabaseError(err.message, "getGroup");
      }
      if (!group) {
        throw new NotFoundError("Group not found", "getGroup");
      }

      // Send response to client
      res.status(200).json(group);
      return;
    } catch (err) {
      if (err instanceof DatabaseError || err instanceof NotFoundError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "getGroup"));
    }
  },

  getGroupUsers: async (req, res, next) => {
    try {
      // Find group by id and include it's users
      let group;
      try {
        group = await Group.findByPk(req.params.groupId, {
          include: {
            model: User,
            as: "Users",
            attributes: { exclude: ["password", "email"] },
          },
        });
      } catch (err) {
        throw new DatabaseError(err.message, "getGroupUsers");
      }

      // If group not found
      if (!group) {
        throw new NotFoundError("Group not found", "getGroupUsers");
      }

      // Send response to client
      res.status(200).json({ users: group.Users });
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "getGroupUsers"));
    }
  },

  getGroupEvents: async (req, res, next) => {
    try {
      const group = req.group;

      // Check if the group exists
      if (!group) {
        throw new NotFoundError("Group not found");
      }

      const events = await Event.findAll({
        where: { GroupId: req.group.id },
        include: [
          {
            model: Group,
            attributes: ["id", "name", "topics", "privacy_settings"],
          },
          {
            model: User,
            attributes: ["id", "username", "avatar"],
          },
        ],
      });

      const count = events.length;

      const eventsWithAttendeeCount = events.map((event) => {
        const eventJSON = event.toJSON();
        eventJSON.attendeeCount = event.Users.length;
        return eventJSON;
      });

      res.status(200).json({ success: true, count, events: eventsWithAttendeeCount });
    } catch (err) {
      if (err instanceof NotFoundError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "getGroupEvents"));
    }
  },

  updateGroup: async (req, res, next) => {
    try {
      // Check if adminCheck middleware executed
      if (!req.isAdmin) {
        throw new ForbiddenError("User is not an admin", "updateGroup");
      }

      // Validate request body
      const { err, value } = putSchema.validate(req.body);
      if (err) {
        let errorMessage = err.details[0].message;
        errorMessage = errorMessage.replace(/\"/g, "");
        throw new ValidationError(`Validation failed: ${errorMessage}`, "signup");
      }

      // Update group
      let group;
      try {
        group = await req.group.update(value);
      } catch (err) {
        if (err.name === "SequelizeUniqueConstraintError") {
          throw new ValidationError("Group name is already in use", "updateGroup");
        }
        throw new DatabaseError(err.message, "updateGroup");
      }

      // Send response to client
      res.status(200).json(group);
      return;
    } catch (err) {
      if (
        err instanceof DatabaseError ||
        err instanceof NotFoundError ||
        err instanceof ValidationError ||
        err instanceof ForbiddenError
      ) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "updateGroup"));
    }
  },

  deleteGroup: async (req, res, next) => {
    try {
      // Check if adminCheck middleware executed
      if (!req.isAdmin) {
        throw new ForbiddenError("Forbidden", "deleteGroup");
      }

      // Delete group
      const groupId = req.params.groupId;
      try {
        await Group.destroy({ where: { id: groupId } });
      } catch (err) {
        throw new DatabaseError(err.message, "deleteGroup");
      }

      // Send response to client
      res.status(200).json({ success: true, message: `Group ${req.group.name} disbanded successfully` });
    } catch (err) {
      if (err instanceof DatabaseError || err instanceof ForbiddenError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "deleteGroup"));
    }
  },

  removeUserFromGroup: async (req, res, next) => {
    try {
      // Check if adminCheck middleware executed
      if (!req.isAdmin) {
        throw new ForbiddenError("Forbidden", "removeUserFromGroup");
      }

      const { groupId, userId } = req.params;

      // Remove user from group
      const result = await GroupUser.destroy({ where: { GroupId: groupId, UserId: userId } });

      // If user not in group
      if (!result) {
        throw new NotFoundError("User not found in group", "removeUserFromGroup");
      }

      // Send response to client
      res.status(200).json({ message: "User removed from group successfully" });
    } catch (err) {
      if (err instanceof ForbiddenError || err instanceof NotFoundError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "removeUserFromGroup"));
    }
  },
};
