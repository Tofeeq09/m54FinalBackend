// src/controllers/groupController.js

// Import the required modules
const { Group } = require("../models");
const {
  CustomError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  DatabaseError,
  BcryptError,
  JwtError,
} = require("../utils/errorHandler");

module.exports = {
  createGroup: async (req, res, next) => {
    try {
      if (!req.authCheck) {
        throw new ForbiddenError("Forbidden", "createGroup");
      }

      const { name, description, privacy_settings } = req.body;
      let { topics } = req.body;

      if (!Array.isArray(topics)) {
        topics = [topics];
      }

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
      } catch (err) {
        throw new DatabaseError(err.message, "createGroup");
      }

      group = group.dataValues;

      res.status(201).json({ success: true, message: "Group created successfully", group });
      return;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "createGroup"));
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
      next(new CustomError(error.message, 500, "getAllGroups"));
    }
  },

  getGroup: async (req, res, next) => {
    try {
      let group;
      try {
        group = await Group.findByPk(req.params.id);
      } catch (err) {
        throw new DatabaseError(err.message, "getGroup");
      }
      if (!group) {
        throw new CustomError("Group not found", 404, "getGroup");
      }
      res.status(200).json(group);
      return;
    } catch (error) {
      if (error instanceof DatabaseError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "getGroup"));
    }
  },

  getGroupUsers: async (req, res, next) => {
    try {
      const { groupId } = req.params;

      // Fetch the group from the database
      const group = await Group.findByPk(groupId);

      // Check if the group exists
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      // Get the users of the group
      const users = await group.getUsers();

      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  },

  updateGroup: async (req, res, next) => {
    try {
      let group;
      try {
        group = await Group.findByPk(req.params.id);
      } catch (err) {
        throw new DatabaseError(err.message, "updateGroup");
      }
      if (group) {
        await group.update(req.body);
        res.status(200).json(group);
        return;
      } else {
        throw new CustomError("Group not found", 404, "updateGroup");
      }
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof CustomError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "updateGroup"));
    }
  },

  deleteGroup: async (req, res, next) => {
    try {
      let group;
      try {
        group = await Group.findByPk(req.params.id);
      } catch (err) {
        throw new DatabaseError(err.message, "deleteGroup");
      }
      if (group) {
        await group.destroy();
        res.status(204).end();
        return;
      } else {
        throw new CustomError("Group not found", 404, "deleteGroup");
      }
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof CustomError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "deleteGroup"));
    }
  },
};
