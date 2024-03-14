// src/routes/userRoutes.js

// Import the required modules
const router = require("express").Router();
const {
  signup,
  login,
  logout,
  getAllUsers,
  getUserEmail,
  sendUpdatedUser,
  deleteUser,
  getUserGroups,
  joinGroup,
  leaveGroup,
  getUserEvents,
  attendEvent,
  cancelEventAttendance,
  getUserDetailsByUsername,
} = require("../controllers/userController");
const {
  hashPassword,
  validate,
  findUser,
  compareAndUpdateUser,
  comparePassword,
} = require("../middleware/auth");
const { tokenCheck } = require("../middleware/verify");

// Define the user routes

router.post("/", hashPassword, signup);
router.post("/login", validate, findUser, comparePassword, login);

router.get("/", getAllUsers);
router.get("/verify", tokenCheck, login);
router.get("/username/:username", getUserDetailsByUsername);
router.get("/private", tokenCheck, getUserEmail);

router.put("/logout", tokenCheck, logout);
router.put("/", tokenCheck, compareAndUpdateUser, sendUpdatedUser);
router.delete("/", tokenCheck, comparePassword, deleteUser);

router.get("/:userId/groups", getUserGroups);
router.post("/group/:groupId", tokenCheck, joinGroup);
router.delete("/group/:groupId", tokenCheck, leaveGroup);

router.get("/:userId/events", getUserEvents);
router.post("/event/:eventId", tokenCheck, attendEvent);
router.delete("/event/:eventId", tokenCheck, cancelEventAttendance);

// Export the user routes
module.exports = router;
