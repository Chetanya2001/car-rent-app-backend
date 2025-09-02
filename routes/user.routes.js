// routes/index.js
const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const { verifyToken, checkRole } = require("../middleware/authmiddleware");

// Public
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/pass-reset", userController.passReset);

// Protected
router.get("/profile", verifyToken, userController.profile);

// Admin only
router.get(
  "/all-users",
  verifyToken,
  checkRole(["admin"]),
  userController.getAllUsers
);

module.exports = router;
