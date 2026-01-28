const { Booking, BookingOTP } = require("../models");
const { generateOTP } = require("../utils/otp.util");
const { Op } = require("sequelize");

/**
 * CREATE OTP (Pickup / Drop)
 */
exports.generateBookingOTP = async (req, res) => {
  try {
    const { booking_id, otp_type } = req.body;

    if (!booking_id || !otp_type) {
      return res
        .status(400)
        .json({ message: "booking_id and otp_type required" });
    }

    if (!["PICKUP", "DROP"].includes(otp_type)) {
      return res.status(400).json({ message: "Invalid otp_type" });
    }

    const booking = await Booking.findByPk(booking_id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 🚫 BUSINESS RULES
    if (otp_type === "PICKUP" && booking.status !== "BOOKED") {
      return res
        .status(400)
        .json({ message: "Pickup OTP allowed only for BOOKED bookings" });
    }

    if (otp_type === "DROP" && booking.status !== "ACTIVE") {
      return res
        .status(400)
        .json({ message: "Drop OTP allowed only for ACTIVE bookings" });
    }

    // ♻️ Prevent duplicate OTP
    const existingOtp = await BookingOTP.findOne({
      where: { booking_id, otp_type },
    });

    if (existingOtp && existingOtp.expires_at > new Date()) {
      return res.status(400).json({
        message: "OTP already generated and still valid",
      });
    }

    const otp = generateOTP();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    const otpRecord = await BookingOTP.upsert({
      booking_id,
      otp_type,
      otp_code: otp,
      expires_at: expiresAt,
      verified_at: null,
      verified_by: null,
    });

    // 🔔 SMS INTEGRATION LATER
    // sendSMS(guest.phone, `Your ${otp_type} OTP is ${otp}`);

    return res.json({
      message: `${otp_type} OTP generated successfully`,
      otp, // ⚠️ expose only in dev
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * VERIFY OTP
 */
exports.verifyBookingOTP = async (req, res) => {
  try {
    const { booking_id, otp_type, otp_code } = req.body;

    if (!booking_id || !otp_type || !otp_code) {
      return res.status(400).json({ message: "All fields required" });
    }

    const otpRecord = await BookingOTP.findOne({
      where: {
        booking_id,
        otp_type,
        otp_code,
        verified_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // ✅ VERIFY OTP
    await otpRecord.update({
      verified_at: new Date(),
      verified_by: "GUEST", // or HOST / DRIVER based on API
    });

    // 🔄 UPDATE BOOKING STATUS
    if (otp_type === "PICKUP") {
      await Booking.update({ status: "ACTIVE" }, { where: { id: booking_id } });
    }

    if (otp_type === "DROP") {
      await Booking.update(
        { status: "COMPLETED" },
        { where: { id: booking_id } },
      );
    }

    return res.json({
      message: `${otp_type} OTP verified successfully`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * RESEND OTP
 */
exports.resendBookingOTP = async (req, res) => {
  try {
    const { booking_id, otp_type } = req.body;

    const otpRecord = await BookingOTP.findOne({
      where: { booking_id, otp_type },
    });

    if (!otpRecord) {
      return res.status(404).json({ message: "OTP not found" });
    }

    if (otpRecord.expires_at < new Date()) {
      return res.status(400).json({ message: "OTP expired, generate new one" });
    }

    // sendSMS again here

    return res.json({
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
