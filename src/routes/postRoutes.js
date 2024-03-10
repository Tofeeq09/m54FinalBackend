// src/routes/userRoutes.js

// Import the required modules
const router = require("express").Router();

const { tokenCheck } = require("../middleware/verify");
const { createPost, getAllPosts, getPost, updatePost, deletePost } = require("../controllers/postController");

// Define the post routes

router.post("/group/:groupId", tokenCheck, createPost);

module.exports = router;
