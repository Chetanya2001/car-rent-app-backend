const cron = require("node-cron");
const { Booking, SelfDriveBooking, User, Car } = require("../models");
const { Op } = require("sequelize");
const { createDropOtp } = require("../services/bookingOTP.service");
const { sendDropOtpMail } = require("../services/booking-mail.service");

console.log("🏁 Drop OTP cron loaded – running every minute");
function toIST(date) {
  if (!date) return "missing";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: true,
  });
}
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);

  try {
    const bookings = await Booking.findAll({
      where: {
        status: "ACTIVE",
        booking_type: "SELF_DRIVE",
      },
      include: [
        {
          model: SelfDriveBooking,
          required: true,
          where: {
            end_datetime: {
              [Op.gte]: toIST(now),
              [Op.lte]: toIST(windowEnd),
            },
          },
        },
        {
          model: Car,
          required: true,
          include: [
            {
              model: User,
              as: "host",
              attributes: ["email", "first_name"],
              required: true,
            },
          ],
        },
      ],
    });

    for (const booking of bookings) {
      const otp = await createDropOtp(booking);
      if (!otp) continue;

      const hostEmail = booking.Car.host.email;

      await sendDropOtpMail(hostEmail, otp, booking.id);

      console.log(`📧 DROP OTP sent to host for booking ${booking.id}`);
    }
  } catch (err) {
    console.error("❌ Drop OTP cron error:", err.message);
  }
});
