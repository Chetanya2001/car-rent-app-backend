const cron = require("node-cron");
const { Booking, SelfDriveBooking, User, Car } = require("../models");
const { Op } = require("sequelize");
const { createPickupOtp } = require("../services/bookingOTP.service");
const { sendPickupOtpMail } = require("../services/booking-mail.service");

// Helper to format dates in IST (Asia/Kolkata)
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
  console.log(`   Server time (UTC): ${now.toISOString()}`);
  console.log(`   Local IST time:    ${formatIST(now)}`);

  try {
    // Window: bookings starting in the next 30 minutes
    const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);

    console.log(
      "Searching for SELF_DRIVE + CONFIRMED bookings starting between:",
    );
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
              [Op.gt]: now,
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
      console.log("No bookings need pickup OTP in the next 30 minutes.");
      return;
    }

    for (const booking of bookings) {
      const bookingId = booking.id;
      const startTime = booking.SelfDriveBooking?.start_datetime;
      const guestEmail = booking.guest?.email?.trim();
      const hostEmail = booking.Car?.host?.email?.trim();

      console.log(`\n─── Processing booking #${bookingId} ───`);
      console.log(
        `  Start time (UTC): ${startTime?.toISOString() || "missing"}`,
      );
      console.log(`  Start time (IST): ${formatIST(startTime)}`);
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
        console.error(
          `Error creating OTP for booking #${bookingId}:`,
          err.message,
        );
        continue;
      }

      if (!otp) {
        console.log(`→ No new OTP generated (already exists or skipped)`);
        continue;
      }

      console.log(`→ OTP generated: ${otp}`);

      // ─── Guest email ───
      if (guestEmail) {
        try {
          await sendPickupOtpMail(guestEmail, otp, bookingId);
          console.log(`→ OTP email sent to guest → ${guestEmail}`);
        } catch (err) {
          console.error(
            `Failed to send OTP email to guest ${guestEmail} (booking #${bookingId}):`,
            err.message,
          );
        }
      } else {
        console.log(`→ No valid guest email found`);
      }

      // ─── Host email ───
      if (hostEmail) {
        try {
          await sendPickupOtpMail(hostEmail, otp, bookingId);
          console.log(`→ OTP email sent to host → ${hostEmail}`);
        } catch (err) {
          console.error(
            `Failed to send OTP email to host ${hostEmail} (booking #${bookingId}):`,
            err.message,
          );
        }
      } else {
        console.log(`→ No valid host email found`);
      }

      console.log(`✅ Finished processing booking #${bookingId}`);
    }

    console.log("✅ Pickup OTP cron completed successfully");
  } catch (err) {
    console.error("❌ Pickup OTP cron failed:", err.stack || err);
  }
});
