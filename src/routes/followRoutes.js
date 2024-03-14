// src/routes/groupRoutes.js

// Import the required modules
const router = require("express").Router();

const {
  followUser,
  unfollowUser,
  getFollowData,
} = require("../controllers/followController");
const { tokenCheck } = require("../middleware/verify");

router.post("/:userId", tokenCheck, followUser);
router.delete("/:userId", tokenCheck, unfollowUser);

router.get("/:userId", tokenCheck, getFollowData);

// Export the follow routes
module.exports = router;
