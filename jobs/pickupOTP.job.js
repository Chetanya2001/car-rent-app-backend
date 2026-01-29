const cron = require("node-cron");
const { Booking, SelfDriveBooking, User, Car } = require("../models");
const { Op } = require("sequelize");
const { createPickupOtp } = require("../services/bookingOTP.service");
const { sendPickupOtpMail } = require("../services/booking-mail.service");

// Helper to format dates in IST (for readable logs)
function formatIST(date) {
  if (!date) return "missing";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: true,
  });
}

console.log("🟢 Pickup OTP cron job loaded – running every minute");

cron.schedule("* * * * *", async () => {
  const now = new Date();

  console.log("⏰ Pickup OTP cron started");
  console.log(`   UTC: ${now.toISOString()}`);
  console.log(`   IST: ${formatIST(now)}`);

  try {
    // KEY CHANGE: Look for bookings where pickup STARTS in the next 0–30 minutes
    const windowEnd = new Date(now.getTime() + 30 * 60 * 1000); // now + 30 min

    console.log("Looking for bookings where pickup STARTS between:");
    console.log(`  UTC:   ${now.toISOString()}  →  ${windowEnd.toISOString()}`);
    console.log(`  IST:   ${formatIST(now)}     →  ${formatIST(windowEnd)}`);

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
              [Op.gte]: now, // ← changed from Op.gt (include exactly now)
              [Op.lte]: windowEnd, // pickup starts ≤ now + 30 min
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

    console.log(
      `→ Found ${bookings.length} booking(s) with pickup in next 30 min`,
    );

    if (bookings.length === 0) {
      // Debug: show next upcoming bookings (remove or comment out later)
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
        console.log("Next upcoming SELF_DRIVE bookings:");
        upcoming.forEach((b) => {
          const st = b.SelfDriveBooking.start_datetime;
          console.log(
            ` - #${b.id} | IST: ${formatIST(st)} | UTC: ${st.toISOString()}`,
          );
        });
      } else {
        console.log("No future SELF_DRIVE CONFIRMED bookings found at all.");
      }

      return;
    }

    for (const booking of bookings) {
      const bookingId = booking.id;
      const startTime = booking.SelfDriveBooking.start_datetime;
      const guestEmail = booking.guest?.email?.trim();
      const hostEmail = booking.Car?.host?.email?.trim();

      console.log(`\n─── Processing booking #${bookingId} ───`);
      console.log(`  Pickup IST: ${formatIST(startTime)}`);
      console.log(`  Pickup UTC: ${startTime.toISOString()}`);
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
        console.error(`OTP creation failed for #${bookingId}:`, err.message);
        continue;
      }

      if (!otp) {
        console.log(`→ Skipped (OTP already exists or not created)`);
        continue;
      }

      console.log(`→ OTP generated: ${otp}`);

      if (guestEmail) {
        try {
          await sendPickupOtpMail(guestEmail, otp, bookingId);
          console.log(`→ Sent to guest: ${guestEmail}`);
        } catch (err) {
          console.error(`Guest email failed #${bookingId}:`, err.message);
        }
      }

      if (hostEmail) {
        try {
          await sendPickupOtpMail(hostEmail, otp, bookingId);
          console.log(`→ Sent to host: ${hostEmail}`);
        } catch (err) {
          console.error(`Host email failed #${bookingId}:`, err.message);
        }
      }

      console.log(`✅ Processed #${bookingId}`);
    }

    console.log("✅ Cron run completed");
  } catch (err) {
    console.error("❌ Cron error:", err.stack || err);
  }
});
