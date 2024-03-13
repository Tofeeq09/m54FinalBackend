// src/routes/friendRoutes.js

// Import the required modules
const router = require("express").Router();

const { tokenCheck } = require("../middleware/verify");
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getAllFriends,
  getFriendRequests,
  unfriend,
} = require("../controllers/friendController");

// Define the friend routes
router.post("/:friendId", tokenCheck, sendFriendRequest);

router.put("/:friendId/accept", tokenCheck, acceptFriendRequest);
router.put("/:friendId/reject", tokenCheck, rejectFriendRequest);

router.get("/", tokenCheck, getAllFriends);
router.get("/requests", tokenCheck, getFriendRequests);

router.delete("/:friendId", tokenCheck, unfriend);

// Export the friend routes
module.exports = router;
