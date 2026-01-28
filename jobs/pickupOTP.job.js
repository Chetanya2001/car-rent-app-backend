const cron = require("node-cron");
const { Booking } = require("../models");
const { Op } = require("sequelize");
const { createPickupOtp } = require("../services/bookingOTP.service");
const { sendPickupOtpToHost } = require("../services/booking-mail.service");

console.log("🟢 Pickup OTP cron loaded");

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const from = new Date(now.getTime() + 30 * 60 * 1000);
    const to = new Date(now.getTime() + 32 * 60 * 1000);

    const bookings = await Booking.findAll({
      where: {
        status: "CONFIRMED",
        booking_type: "SELF_DRIVE",
      },
    });

    for (const booking of bookings) {
      const otp = await createPickupOtp(booking);

      if (otp) {
        await sendPickupOtpToHost(booking.id, otp);
      }
    }
  } catch (err) {
    console.error("❌ Pickup OTP cron error:", err);
  }
});
