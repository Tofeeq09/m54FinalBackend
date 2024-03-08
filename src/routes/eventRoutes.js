// src/routes/eventRoutes.js

// Import the required modules
const router = require("express").Router();
const { createEvent } = require("../controllers/eventController");
const { tokenCheck } = require("../middleware/verify");

// Define the event routes

router.post("/group/:groupId", tokenCheck, createEvent);

// Export the event routes
module.exports = router;
