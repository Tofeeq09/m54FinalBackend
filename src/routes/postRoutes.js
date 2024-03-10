// src/routes/postRoutes.js

// Import the required modules
const router = require("express").Router();

const { tokenCheck } = require("../middleware/verify");
const { createPost, getGroupPosts, getEventPosts, deletePost } = require("../controllers/postController");
const { adminCheck } = require("../middleware/auth");

// Define the post routes

router.post("/group/:groupId", tokenCheck, createPost);

router.get("/group/:groupId", tokenCheck, getGroupPosts);
router.get("/group/:groupId/event/:eventId", tokenCheck, getEventPosts);

// router.put("/:postId", tokenCheck, updatePost);

router.delete("/:postId", tokenCheck, deletePost);

// Export the post routes
module.exports = router;
