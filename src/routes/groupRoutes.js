// src/routes/groupRoutes.js

// Import the required modules
const router = require("express").Router();

const { tokenCheck } = require("../middleware/verify");
const { adminCheck } = require("../middleware/auth");
const {
  createGroup,
  getAllGroups,
  getGroup,
  getGroupUsers,
  updateGroup,
  deleteGroup,
  removeUserFromGroup,
} = require("../controllers/groupController");

// Define the group routes

router.post("/", tokenCheck, createGroup);

router.get("/", getAllGroups);
router.get("/:groupId", getGroup);
router.get("/:groupId/users", getGroupUsers);

router.put("/:groupId", tokenCheck, adminCheck, updateGroup);

router.delete("/:groupId", tokenCheck, adminCheck, deleteGroup);
router.delete("/:groupId/users/:userId", tokenCheck, adminCheck, removeUserFromGroup);

// Export the group routes
module.exports = router;
