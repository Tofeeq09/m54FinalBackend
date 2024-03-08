// src/controllers/eventController.js

// Import the required modules
const Joi = require("joi");
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

module.exports = {
  createEvent: async (req, res, next) => {
    try {
      const groupId = req.params.groupId;
      const userId = req.authCheck.id;

      const user = await User.findByPk(userId);
      const group = await Group.findByPk(groupId);

      // Check if the user and group exist
      if (!user) {
        throw new NotFoundError("User not found");
      }
      if (!group) {
        throw new NotFoundError("Group not found");
      }

      // Check if the user is a member of the group
      const isMember = await group.hasUser(user);
      if (!isMember) {
        throw new ValidationError(`User ${user.username} is not a member of group ${group.name}`, "createEvent");
      }

      // Create the event
      const event = await Event.create({
        name: req.body.name,
        description: req.body.description,
        date: req.body.date,
        time: req.body.time,
        location: req.body.location,
        GroupId: groupId, // Associate the event with the group
      });

      // Associate the user with the event as the organizer
      await EventUser.create({
        UserId: userId,
        EventId: event.id,
        role: "organizer",
      });

      res.status(201).json({ success: true, message: "Event created successfully", event });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof DatabaseError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "createEvent"));
    }
  },
};
