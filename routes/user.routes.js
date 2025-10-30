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

router.get("/verify-email", userController.verifyEmail);

router.post("/support-mail", userController.sendSupportMessage);

router.delete(
  "/delete-user/:id",
  verifyToken,
  checkRole(["admin"]),
  userController.deleteUser
);

router.get(
  "/get-hosts",
  verifyToken,
  checkRole(["admin"]),
  userController.getAllHosts
);

router.put(
  "/update-user/:id",
  verifyToken,
  checkRole(["admin"]),
  userController.updateUser
);
module.exports = router;
