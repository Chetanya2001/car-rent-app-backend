// routes/selfDriveBooking.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controller/selfDriveBooking.controller");
const { verifyToken } = require("../middleware/authmiddleware");

router.post("/book", verifyToken, controller.bookSelfDrive);

module.exports = router;
