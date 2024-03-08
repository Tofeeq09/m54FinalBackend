// src/routes/groupRoutes.js

// Import the required modules
const router = require("express").Router();
// const { createGroup } = require("../controllers/groupController");
const { tokenCheck } = require("../middleware/verify");
const { createGroup, getAllGroups, getGroup, getGroupUsers } = require("../controllers/groupController");

// Define the group routes

router.post("/", tokenCheck, createGroup);
router.get("/", getAllGroups);
router.get("/:id", getGroup);
router.get("/groups/:groupId/users", getGroupUsers);

// Export the group routes
module.exports = router;
