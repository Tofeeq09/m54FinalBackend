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

const updateEventSchema = Joi.object({
  name: Joi.string().min(3).max(50),
  description: Joi.string().min(10).max(500),
  date: Joi.date(),
  time: Joi.string().pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  location: Joi.string().min(3).max(100),
});

module.exports = {
  createEvent: async (req, res, next) => {
    try {
      const user = req.authCheck;
      const group = req.group;

      // Check if the group exist
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
        GroupId: group.id,
      });

      // Associate the user with the event as the organizer
      await EventUser.create({
        UserId: user.id,
        EventId: event.id,
        role: "organizer",
      });

      // Send response to client
      res.status(201).json({ success: true, message: "Event created successfully", event });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof DatabaseError) {
        next(error);
        return;
      }
      next(new CustomError(error.message, 500, "createEvent"));
    }
  },

  getAllEvents: async (req, res, next) => {
    try {
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

      const count = events.length;

      const eventsWithAttendeeCount = events.map((event) => {
        const eventJSON = event.toJSON();
        eventJSON.attendeeCount = event.Users.length;
        return eventJSON;
      });

      res.status(200).json({ success: true, count, events: eventsWithAttendeeCount });
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

      const count = events.length;

      const eventsWithAttendeeCount = events.map((event) => {
        const eventJSON = event.toJSON();
        eventJSON.attendeeCount = event.Users.length;
        return eventJSON;
      });

      res.status(200).json({ success: true, count, events: eventsWithAttendeeCount });
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
      const event = await Event.findByPk(eventId, {
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

      // Check if the event exists
      if (!event) {
        throw new NotFoundError("Event not found");
      }

      const eventJSON = event.toJSON();
      eventJSON.attendeeCount = event.Users.length;

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
        const { err, value } = updateEventSchema.validate(req.body);
        if (err) {
          let errorMessage = err.details[0].message;
          errorMessage = errorMessage.replace(/\"/g, "");
          throw new ValidationError(`Validation failed: ${errorMessage}`, "signup");
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
        res.status(200).json({ success: true, message: `Event cancelled successfully` });
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
        res.status(200).json({ success: true, message: `Event ${req.event.name} cancelled successfully` });
        return;
      }

      throw new ForbiddenError("User is not an admin or an organizer", "deleteEvent");
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError) {
        next(err);
        return;
      }
      next(new CustomError(err.message, 500, "deleteEvent"));
    }
  },
};
