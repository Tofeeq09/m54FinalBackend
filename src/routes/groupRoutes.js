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
  banUser,
} = require("../controllers/groupController");

// Define the group routes

router.post("/", tokenCheck, createGroup);

router.get("/", getAllGroups);
router.get("/:groupId", getGroup);
router.get("/:groupId/users", getGroupUsers);
router.get("/:groupId/events", groupCheck, getGroupEvents);

router.put("/:groupId", tokenCheck, adminCheck, updateGroup);

router.delete("/:groupId", tokenCheck, adminCheck, deleteGroup);
router.delete("/:groupId/kick/:userId", tokenCheck, adminCheck, removeUserFromGroup);
// router.post("/:groupId/ban/:userId", tokenCheck, adminCheck, banUser);

// Export the group routes
module.exports = router;
