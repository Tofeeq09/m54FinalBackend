// src/routes/friendRoutes.js

// Import the required modules
const router = require("express").Router();

const { tokenCheck } = require("../middleware/verify");
const {
  addFriend,
  removeFriend,
  getUserFriends,
} = require("../controllers/friendController");

// Define the friend routes
router.post("/:friendId", tokenCheck, addFriend);
router.delete("/:friendId", tokenCheck, removeFriend);
router.get("/", tokenCheck, getUserFriends);

// Export the friend routes
module.exports = router;
