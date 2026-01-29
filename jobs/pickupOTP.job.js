const cron = require("node-cron");
const { Booking, SelfDriveBooking, User, Car } = require("../models");
const { Op } = require("sequelize");
const { createPickupOtp } = require("../services/bookingOTP.service");
const { sendPickupOtpMail } = require("../services/booking-mail.service");

// Helper: Format date to readable IST string
function toIST(date) {
  if (!date) return "missing";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: true,
  });
}

console.log("🟢 Pickup OTP cron loaded – running every minute");

cron.schedule("* * * * *", async () => {
  const now = new Date();

  console.log("⏰ Cron started at IST:", toIST(now));

  try {
    const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);

    console.log("Looking for pickups starting between IST:");
    console.log(`  ${toIST(now)}  →  ${toIST(windowEnd)}`);

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
              [Op.gte]: now,
              [Op.lte]: windowEnd,
            },
          },
        },
        {
          model: User,
          as: "guest",
          attributes: ["id", "email", "first_name"],
          required: true,
        },
        {
          model: Car,
          required: true,
          include: [
            {
              model: User,
              as: "host",
              attributes: ["id", "email", "first_name"],
              required: true,
            },
          ],
        },
      ],
      order: [[{ model: SelfDriveBooking }, "start_datetime", "ASC"]],
    });

    console.log(`→ Found ${bookings.length} eligible booking(s)`);

    if (bookings.length === 0) {
      // Show next upcoming for debug (in IST only)
      const upcoming = await Booking.findAll({
        where: { status: "CONFIRMED", booking_type: "SELF_DRIVE" },
        include: [
          {
            model: SelfDriveBooking,
            where: { start_datetime: { [Op.gt]: now } },
            required: true,
          },
        ],
        limit: 3,
        order: [[SelfDriveBooking, "start_datetime", "ASC"]],
      });

      if (upcoming.length > 0) {
        console.log("Next upcoming pickups (IST):");
        upcoming.forEach((b) => {
          console.log(
            ` - Booking #${b.id} | ${toIST(b.SelfDriveBooking.start_datetime)}`,
          );
        });
      } else {
        console.log("No future SELF_DRIVE CONFIRMED bookings found.");
      }

      console.log("No pickups in next 30 minutes.");
      return;
    }

    for (const booking of bookings) {
      const bookingId = booking.id;
      const startTimeIST = toIST(booking.SelfDriveBooking.start_datetime);
      const guestEmail = booking.guest?.email?.trim();
      const hostEmail = booking.Car?.host?.email?.trim();

      console.log(`\n─── Processing booking #${bookingId} ───`);
      console.log(`  Pickup time (IST): ${startTimeIST}`);
      console.log(
        `  Guest: ${guestEmail || "missing"} (${booking.guest?.first_name || "?"})`,
      );
      console.log(
        `  Host:  ${hostEmail || "missing"} (${booking.Car?.host?.first_name || "?"})`,
      );

      let otp;
      try {
        otp = await createPickupOtp(booking);
      } catch (err) {
        console.error(`OTP creation error #${bookingId}:`, err.message);
        continue;
      }

      if (!otp) {
        console.log(`→ No new OTP created`);
        continue;
      }

      console.log(`→ OTP: ${otp}`);

      if (guestEmail) {
        try {
          await sendPickupOtpMail(guestEmail, otp, bookingId);
          console.log(`→ Email sent to guest: ${guestEmail}`);
        } catch (err) {
          console.error(`Guest email failed #${bookingId}:`, err.message);
        }
      }

      if (hostEmail) {
        try {
          await sendPickupOtpMail(hostEmail, otp, bookingId);
          console.log(`→ Email sent to host: ${hostEmail}`);
        } catch (err) {
          console.error(`Host email failed #${bookingId}:`, err.message);
        }
      }

      console.log(`✅ Finished #${bookingId}`);
    }

    console.log("✅ Cron completed");
  } catch (err) {
    console.error("❌ Cron error:", err.message);
  }
});
