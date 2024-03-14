// src/routes/groupRoutes.js

// Import the required modules
const router = require("express").Router();

const {
  followUser,
  unfollowUser,
  getFollowData,
  isFollowing,
} = require("../controllers/followController");
const { tokenCheck } = require("../middleware/verify");

router.post("/:userId", tokenCheck, followUser);
router.delete("/:userId", tokenCheck, unfollowUser);

router.get("/:userId", tokenCheck, getFollowData);
router.get("/isFollowing/:userId", tokenCheck, isFollowing);

// Export the follow routes
module.exports = router;
