// src/controllers/groupController.js

// Import the required modules
const Joi = require("joi");
const { User, Group, GroupUser } = require("../models");
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
      if (!req.authCheck) {
        throw new ForbiddenError("Forbidden", "createGroup");
      }

      const { error, value } = postSchema.validate(req.body);
      if (error) {
        let errorMessage = error.details[0].message;
        errorMessage = errorMessage.replace(/\"/g, "");
        throw new ValidationError(`Validation failed: ${errorMessage}`, "signup");
      }

      const { name, description, privacy_settings, topics } = value;

      const existingGroup = await Group.findOne({ where: { name } });
      if (existingGroup) {
        throw new ValidationError("Validation failed: Group already exists", "createGroup");
      }

      let group;
      try {
        group = await Group.create({
          name,
          description,
          topics,
          privacy_settings,
        });

        const user = await User.findByPk(req.authCheck.id);
        if (user) {
          await group.addUser(user, { through: { role: "admin" } });
        }
      } catch (err) {
        throw new DatabaseError(err.message, "createGroup");
      }

      group = group.dataValues;

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
      let groups;
      try {
        groups = await Group.findAll();
      } catch (err) {
        throw new DatabaseError(err.message, "getAllGroups");
      }
      res.status(200).json(groups);
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
      let group;
      try {
        group = await Group.findByPk(req.params.groupId);
      } catch (err) {
        throw new DatabaseError(err.message, "getGroup");
      }
      if (!group) {
        throw new NotFoundError("Group not found", "getGroup");
      }
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
      let group;
      try {
        group = await Group.findByPk(req.params.groupId);
      } catch (err) {
        throw new DatabaseError(err.message, "getGroupUsers");
      }

      if (!group) {
        throw new NotFoundError("Group not found", "getGroupUsers");
      }

      let users;
      try {
        users = await group.getUsers();
      } catch (err) {
        throw new DatabaseError(err.message, "getGroupUsers");
      }

      res.status(200).json(users);
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "getGroupUsers"));
    }
  },

  updateGroup: async (req, res, next) => {
    try {
      const { error, value } = putSchema.validate(req.body);
      if (error) {
        let errorMessage = error.details[0].message;
        errorMessage = errorMessage.replace(/\"/g, "");
        throw new ValidationError(`Validation failed: ${errorMessage}`, "signup");
      }

      let group;
      try {
        group = await Group.findByPk(req.params.groupId);
      } catch (err) {
        throw new DatabaseError(err.message, "updateGroup");
      }
      if (group) {
        await group.update(value);
        res.status(200).json(group);
        return;
      } else {
        throw new NotFoundError("Group not found", "updateGroup");
      }
    } catch (err) {
      if (err instanceof DatabaseError || err instanceof NotFoundError || err instanceof ValidationError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "updateGroup"));
    }
  },

  deleteGroup: async (req, res, next) => {
    try {
      if (!req.isAdmin) {
        throw new ForbiddenError("Forbidden", "deleteGroup");
      }

      const groupId = req.params.groupId;
      try {
        await Group.destroy({ where: { id: groupId } });
        res.status(204).end();
        return;
      } catch (err) {
        throw new DatabaseError(err.message, "deleteGroup");
      }
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
      if (!req.isAdmin) {
        throw new ForbiddenError("Forbidden", "removeUserFromGroup");
      }

      const { groupId, userId } = req.params;

      // Remove the user from the group
      const result = await GroupUser.destroy({ where: { GroupId: groupId, UserId: userId } });

      if (!result) {
        throw new NotFoundError("User not found in group", "removeUserFromGroup");
      }

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
