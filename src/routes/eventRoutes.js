// src/routes/eventRoutes.js

// Import the required modules
const router = require("express").Router();
const { createEvent, getAllEvents, getEvent, updateEvent, deleteEvent } = require("../controllers/eventController");
const { tokenCheck } = require("../middleware/verify");
const { adminCheck, groupCheck, organizerCheck } = require("../middleware/auth");

// Define the event routes

router.post("/group/:groupId", tokenCheck, groupCheck, createEvent);

router.get("/", getAllEvents);
router.get("/:eventId", getEvent);

router.put("/:eventId", tokenCheck, organizerCheck, updateEvent);

router.delete("/:eventId", tokenCheck, organizerCheck, deleteEvent);
router.delete("/groups/:groupId/event/:eventId", tokenCheck, adminCheck, deleteEvent);

// Export the event routes
module.exports = router;
