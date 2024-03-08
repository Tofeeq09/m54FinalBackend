// src/routes/userRoutes.js

// Import the required modules
const router = require("express").Router();
const {
  signup,
  login,
  logout,
  getAllUsers,
  getUser,
  sendUpdatedUser,
  deleteUser,
  getUserGroups,
  joinGroup,
} = require("../controllers/userController");
const { hashPassword, validate, findUser, compareAndUpdateUser, comparePassword } = require("../middleware/auth");
const { tokenCheck } = require("../middleware/verify");

// Define the user routes

router.get("/", getAllUsers);
router.get("/:id", getUser);
router.get("/users/:userId/groups", getUserGroups);
router.get("/verify", tokenCheck, login);
router.post("/verify", tokenCheck, login);
router.post("/login", validate, findUser, comparePassword, login);
router.post("/", hashPassword, signup);
router.post("/join/:groupId", tokenCheck, joinGroup);
router.put("/:id/logout", tokenCheck, logout);
router.put("/:id", tokenCheck, compareAndUpdateUser, sendUpdatedUser);
router.delete("/:id", tokenCheck, comparePassword, deleteUser);

// Export the user routes
module.exports = router;
