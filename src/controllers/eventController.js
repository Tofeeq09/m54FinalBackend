// src/controllers/eventController.js

// Import the required modules
const Joi = require("joi");
const { User, Group, GroupUser, Event, EventUser, Post } = require("../models");
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

const eventSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  date: Joi.date().min("now").required().messages({
    "date.min": "Date cannot be in the past",
  }),
  time: Joi.string()
    .pattern(new RegExp("^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"))
    .required()
    .messages({
      "string.pattern.base": "Time must be in the format HH:MM",
    }),
  location: Joi.string().required(),
});

module.exports = {
  createEvent: async (req, res, next) => {
    try {
      const user = req.authCheck;
      const group = req.group;

      // Validate request body
      const { error, value } = eventSchema.validate(req.body);
      if (error) {
        let errorMessage = error.details[0].message;
        errorMessage = errorMessage.replace(/\"/g, "");
        throw new ValidationError(
          `Validation failed: ${errorMessage}`,
          "createEvent"
        );
      }

      // Extract required fields from request body
      const { name, description, date, time, location } = value;

      // Check if group exist
      if (!group) {
        throw new NotFoundError("Group not found");
      }

      // Check if user is a member of group
      const isMember = await group.hasUser(user);
      if (!isMember) {
        throw new ValidationError(
          `User ${user.username} is not a member of group ${group.name}`,
          "createEvent"
        );
      }

      // Create event
      const event = await Event.create({
        name,
        description,
        date,
        time,
        location,
        GroupId: group.id,
      });

      // Associate user with event as the organizer
      await EventUser.create({
        UserId: user.id,
        EventId: event.id,
        role: "organizer",
      });

      // Fetch the event again to include the organizer
      const createdEvent = await Event.findByPk(event.id, {
        include: [
          {
            model: User,
            attributes: ["id", "username", "avatar"],
          },
        ],
      });

      // Attach attendee count to the event
      const eventJSON = createdEvent.toJSON();
      eventJSON.attendeeCount = createdEvent.Users.length;

      // Send response to client
      res.status(201).json({
        success: true,
        message: "Event created successfully",
        event: eventJSON,
      });
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof DatabaseError
      ) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "createEvent"));
    }
  },

  getAllEvents: async (req, res, next) => {
    try {
      // Get all event with their group and attendees
      const events = await Event.findAll({
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

      // Count events
      const count = events.length;

      // Attach attendee count to each event
      const eventsWithAttendeeCount = events.map((event) => {
        const eventJSON = event.toJSON();
        eventJSON.attendeeCount = event.Users.length;
        return eventJSON;
      });

      // Send response to client
      res
        .status(200)
        .json({ success: true, count, events: eventsWithAttendeeCount });
    } catch (error) {
      next(new CustomError(error.message, 500, "getAllEvents"));
    }
  },

  getGroupEvents: async (req, res, next) => {
    try {
      const groupId = req.params.groupId;
      const group = await Group.findByPk(groupId);

      // Check if the group exists
      if (!group) {
        throw new NotFoundError("Group not found");
      }

      // Get all events of group with their group and attendees
      const events = await Event.findAll({
        where: { GroupId: groupId },
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

      // Count events
      const count = events.length;

      // Attach attendee count to each event
      const eventsWithAttendeeCount = events.map((event) => {
        const eventJSON = event.toJSON();
        eventJSON.attendeeCount = event.Users.length;
        return eventJSON;
      });

      // Send response to client
      res
        .status(200)
        .json({ success: true, count, events: eventsWithAttendeeCount });
    } catch (error) {
      if (error instanceof NotFoundError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "getGroupEvents"));
    }
  },

  getEvent: async (req, res, next) => {
    try {
      const eventId = req.params.eventId;

      // Get a single event with its group, attendees, and posts
      const event = await Event.findByPk(eventId, {
        include: [
          {
            model: Group,
            attributes: ["id", "name", "topics", "privacy_settings"],
          },
          {
            model: User,
            attributes: ["id", "username", "avatar", "online"],
          },
          {
            model: Post,
            attributes: ["id", "content", "createdAt", "updatedAt"],
            include: [
              {
                model: User,
                attributes: ["id", "username", "avatar", "online"],
              },
            ],
          },
        ],
      });

      // Check if the event exists
      if (!event) {
        throw new NotFoundError("Event not found");
      }

      // Attach attendee count to the event
      const eventJSON = event.toJSON();
      eventJSON.attendeeCount = event.Users.length;

      // Send response to client
      res.status(200).json({ success: true, event: eventJSON });
    } catch (error) {
      if (error instanceof NotFoundError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "getEvent"));
    }
  },

  updateEvent: async (req, res, next) => {
    try {
      if (req.isOrganizer) {
        // Validate the request body
        const { err, value } = eventSchema.validate(req.body);
        if (err) {
          let errorMessage = err.details[0].message;
          errorMessage = errorMessage.replace(/\"/g, "");
          throw new ValidationError(
            `Validation failed: ${errorMessage}`,
            "signup"
          );
        }

        const eventId = req.params.eventId;

        // Update the event
        let updatedEvent;
        try {
          updatedEvent = await Event.update(value, {
            where: {
              id: eventId,
            },
            returning: true,
            plain: true,
          });
        } catch (err) {
          throw new DatabaseError(err.message, "updateEvent");
        }

        // If no event was updated
        if (!updatedEvent[1]) {
          throw new NotFoundError("Event not found", "updateEvent");
        }

        // Send the updated event to the client
        res.status(200).json({ success: true, event: updatedEvent[1] });
        return;
      }

      // If the user is not the organizer of the event
      throw new ForbiddenError("You are not the organizer of this event");
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof DatabaseError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "updateEvent"));
    }
  },

  deleteEvent: async (req, res, next) => {
    try {
      // Check request made by admin
      if (req.isAdmin) {
        // Delete the event
        try {
          await Event.destroy({ where: { id: req.params.eventId } });
        } catch (err) {
          throw new DatabaseError(err.message, "deleteEvent");
        }

        // Send a success message to the client
        res
          .status(200)
          .json({ success: true, message: `Event cancelled successfully` });
        return;
      }

      // If request made by organizer
      if (req.isOrganizer) {
        // Delete the event
        try {
          await Event.destroy({ where: { id: req.params.eventId } });
        } catch (err) {
          throw new DatabaseError(err.message, "deleteEvent");
        }

        // Send a success message to the client
        res.status(200).json({
          success: true,
          message: `Event ${req.event.name} cancelled successfully`,
        });
        return;
      }

      throw new ForbiddenError(
        "User is not an admin or an organizer",
        "deleteEvent"
      );
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "deleteEvent"));
    }
  },

  checkGroupMembershipFromEvent: async (req, res, next) => {
    try {
      const eventId = req.params.eventId;
      const userId = req.authCheck.id;

      const event = await Event.findByPk(eventId);
      if (!event) {
        return res
          .status(404)
          .json({ isMember: false, message: "Event not found" });
      }

      const group = await event.getGroup();
      if (!group) {
        return res
          .status(404)
          .json({ isMember: false, message: "Group not found" });
      }

      const isMember = await group.hasUser(userId);
      if (!isMember) {
        return res
          .status(200)
          .json({ isMember: false, message: "User is not a member of group" });
      }

      res
        .status(200)
        .json({ isMember: true, message: "User is a member of group" });
    } catch (err) {
      next(new CustomError(err.message, 500, "checkGroupMembership"));
    }
  },
};
