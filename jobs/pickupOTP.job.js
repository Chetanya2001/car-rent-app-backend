const cron = require("node-cron");
const { Booking, User } = require("../models");
const { createPickupOtp } = require("../services/bookingOTP.service");
const { sendPickupOtpMail } = require("../services/booking-mail.service");
const { Op } = require("sequelize");

cron.schedule("* * * * *", async () => {
  const now = new Date();
  const from = new Date(now.getTime() + 30 * 60 * 1000);
  const to = new Date(now.getTime() + 32 * 60 * 1000);

  const bookings = await Booking.findAll({
    where: {
      status: "CONFIRMED",
      pickup_datetime: { [Op.between]: [from, to] },
    },
    include: [{ model: User, as: "host" }],
  });

  for (const booking of bookings) {
    const otp = await createPickupOtp(booking);
    if (!otp) continue;

    await sendPickupOtpMail(booking.host.email, otp, booking.id);
  }
});
