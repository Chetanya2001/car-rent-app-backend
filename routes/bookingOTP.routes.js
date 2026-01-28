const express = require("express");
const router = express.Router();
const bookingOtpController = require("../controller/bookingOTP.controller");
const { verifyToken } = require("../middleware/authmiddleware");

// 🔐 Protected routes
router.post("/verify", verifyToken, bookingOtpController.verifyBookingOTP);
router.post("/resend", verifyToken, bookingOtpController.resendBookingOTP);

module.exports = router;
