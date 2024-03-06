// src/routes/userRoutes.js
// src/routes/userRoutes.js

const express = require("express");
const router = express.Router();
const { signup } = require("../controllers/userController");
const { hashPassword } = require("../middleware/auth");

router.post("/signup", hashPassword, signup);

module.exports = router;
