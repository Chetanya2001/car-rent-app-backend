const express = require("express");
const router = express.Router();

const userRoutes = require("./user.routes");
const userProfileRoutes = require("./userProfile.routes");

router.use("/users", userRoutes);
router.use("/user-profile", userProfileRoutes);
module.exports = router;
