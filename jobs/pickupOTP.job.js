const cron = require("node-cron");
const { Booking, SelfDriveBooking, User, Car } = require("../models");
const { Op } = require("sequelize");
const { createPickupOtp } = require("../services/bookingOTP.service");
const { sendPickupOtpMail } = require("../services/booking-mail.service");

// Beautiful IST time formatter
const formatIST = (date) => {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: true,
  });
};

console.log("Pickup OTP Cron Started → Will send OTP 30 minutes before pickup");

cron.schedule("* * * * *", async () => {
  const now = new Date();

  // We want bookings where pickup starts in the next 30 minutes
  // i.e. start_datetime is between NOW and NOW + 30 mins
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

  try {
    const bookings = await Booking.findAll({
      where: {
        status: "CONFIRMED",
        booking_type: "SELF_DRIVE",
      },
      include: [
        {
          model: SelfDriveBooking,
          required: true,
          where: {
            start_datetime: {
              [Op.gte]: now, // ≥ now
              [Op.lte]: thirtyMinutesFromNow, // ≤ now + 30 mins
            },
          },
        },
        { model: User, as: "guest", attributes: ["email", "first_name"] },
        {
          model: Car,
          include: [
            { model: User, as: "host", attributes: ["email", "first_name"] },
          ],
        },
      ],
      order: [[SelfDriveBooking, "start_datetime", "ASC"]],
    });

    if (bookings.length === 0) {
      // Optional: Show next upcoming booking for debugging
      const next = await SelfDriveBooking.findOne({
        include: [
          {
            model: Booking,
            where: { status: "CONFIRMED", booking_type: "SELF_DRIVE" },
          },
        ],
        order: [["start_datetime", "ASC"]],
        where: { start_datetime: { [Op.gt]: now } },
      });
      if (next) {
        console.log(
          `No booking in next 30 mins. Next pickup: ${formatIST(next.start_datetime)} (Booking #${next.booking_id})`,
        );
      }
      return;
    }

    console.log(`Found ${bookings.length} booking(s) → Sending Pickup OTP now`);

    for (const booking of bookings) {
      const startIST = formatIST(booking.SelfDriveBooking.start_datetime);
      console.log(`Processing Booking #${booking.id} → Pickup at ${startIST}`);

      const otp = await createPickupOtp(booking);

      if (!otp) {
        console.log(`OTP already sent or not generated for #${booking.id}`);
        continue;
      }

      console.log(`OTP Generated: ${otp} for Booking #${booking.id}`);

      const guestEmail = booking.guest?.email;
      const hostEmail = booking.Car?.host?.email;

      if (guestEmail) {
        await sendPickupOtpMail(guestEmail, otp, booking.id);
        console.log(`OTP Email Sent to Guest → ${guestEmail}`);
      }

      if (hostEmail) {
        await sendPickupOtpMail(hostEmail, otp, booking.id);
        console.log(`OTP Email Sent to Host → ${hostEmail}`);
      }

      console.log(`Pickup OTP Successfully Sent for Booking #${booking.id}\n`);
    }
  } catch (error) {
    console.error("Pickup OTP Cron Failed:", error.message);
  }
});
