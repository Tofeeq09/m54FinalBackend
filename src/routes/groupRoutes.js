// src/routes/groupRoutes.js

// Import the required modules
const router = require("express").Router();

const { tokenCheck } = require("../middleware/verify");
const { adminCheck, groupCheck } = require("../middleware/auth");
const {
  createGroup,
  getAllGroups,
  getGroup,
  getGroupUsers,
  updateGroup,
  deleteGroup,
  removeUserFromGroup,
  getGroupEvents,
  banUserFromGroup,
} = require("../controllers/groupController");
const { deleteEvent } = require("../controllers/eventController");

// Define the group routes

router.post("/", tokenCheck, createGroup);

router.get("/", getAllGroups);
router.get("/:groupId", getGroup);
router.get("/:groupId/users", getGroupUsers);
router.get("/:groupId/events", groupCheck, getGroupEvents);

router.put("/:groupId", tokenCheck, adminCheck, updateGroup);

router.delete("/:groupId", tokenCheck, adminCheck, deleteGroup);
router.delete("/:groupId/user/kick/:userId", tokenCheck, adminCheck, removeUserFromGroup);

// Export the group routes
module.exports = router;
