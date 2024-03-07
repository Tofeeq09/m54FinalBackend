// src/routes/userRoutes.js

// Import the required modules
const express = require("express");
const router = express.Router();
const { signup, login, logout, getAllUsers, getUser } = require("../controllers/userController");
const { hashPassword, validate, findUser, comparePassword } = require("../middleware/auth");
const verify = require("../middleware/verify");

// Define the user routes

router.get("/", getAllUsers);
router.get("/:id", getUser);
router.get("/verify", verify, login);
router.post("/login", validate, findUser, comparePassword, login);
router.post("/signup", hashPassword, signup);
router.put("/:id/logout", verify, logout);

// Export the user routes
module.exports = router;
