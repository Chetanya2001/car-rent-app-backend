const cron = require("node-cron");
const { Booking, SelfDriveBooking, User, Car } = require("../models");
const { Op } = require("sequelize");
const { createPickupOtp } = require("../services/bookingOTP.service");
const { sendPickupOtpMail } = require("../services/booking-mail.service");

console.log("🟢 Pickup OTP cron loaded");

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const limit = new Date(now.getTime() + 30 * 60 * 1000);

    const bookings = await Booking.findAll({
      where: {
        status: "CONFIRMED",
        booking_type: "SELF_DRIVE",
      },
      include: [
        {
          model: SelfDriveBooking,
          where: {
            start_datetime: {
              [Op.lte]: limit, // 🔥 KEY CHANGE
              [Op.gt]: now,
            },
          },
        },
        {
          model: User,
          as: "guest",
          attributes: ["email", "first_name"],
        },
        {
          model: Car,
          include: [
            {
              model: User,
              as: "host",
              attributes: ["email", "first_name"],
            },
          ],
        },
      ],
    });

    for (const booking of bookings) {
      const otp = await createPickupOtp(booking);
      for (const booking of bookings) {
        console.log("🔍 DEBUG BOOKING:", {
          id: booking.id,
          guestEmail: booking.guest?.email,
          hostEmail: booking.Car?.host?.email,
          start: booking.SelfDriveBooking?.start_datetime,
        });
      }

      if (!otp) continue;

      const guestEmail = booking.guest?.email;
      const hostEmail = booking.Car?.host?.email;

      if (guestEmail) {
        await sendPickupOtpMail(guestEmail, otp, booking.id);
      }

      if (hostEmail) {
        await sendPickupOtpMail(hostEmail, otp, booking.id);
      }

      console.log(`✅ Pickup OTP sent for booking ${booking.id}`);
    }
  } catch (err) {
    console.error("❌ Pickup OTP cron error:", err);
  }
});
