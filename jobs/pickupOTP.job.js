const cron = require("node-cron");
const { Booking, SelfDriveBooking, User, Car } = require("../models");
const { Op } = require("sequelize");
const { createPickupOtp } = require("../services/bookingOTP.service");
const { sendPickupOtpMail } = require("../services/booking-mail.service");

console.log("🟢 Pickup OTP cron job loaded – running every minute");

cron.schedule("* * * * *", async () => {
  console.log("⏰ Pickup OTP cron started at", new Date().toISOString());

  try {
    const now = new Date();
    // You can adjust this window — 30 minutes is quite narrow
    const windowEnd = new Date(now.getTime() + 30 * 60 * 1000); // now + 30 min

    console.log(
      `Searching for SELF_DRIVE CONFIRMED bookings starting between:`,
    );
    console.log(`  ${now.toISOString()}  →  ${windowEnd.toISOString()}`);

    const bookings = await Booking.findAll({
      where: {
        status: "CONFIRMED",
        booking_type: "SELF_DRIVE",
      },
      include: [
        {
          model: SelfDriveBooking,
          required: true, // ← important: only bookings that have SelfDriveBooking
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
      // Optional: order by soonest pickup
      order: [[SelfDriveBooking, "start_datetime", "ASC"]],
    });

    console.log(`→ Found ${bookings.length} eligible bookings`);

    if (bookings.length === 0) {
      console.log("No bookings need pickup OTP right now.");
      return;
    }

    for (const booking of bookings) {
      const bookingId = booking.id;
      const startTime = booking.SelfDriveBooking?.start_datetime;
      const guestEmail = booking.guest?.email;
      const hostEmail = booking.Car?.host?.email;

      console.log(`\n─── Processing booking #${bookingId} ───`);
      console.log(`  Start:     ${startTime?.toISOString() || "missing"}`);
      console.log(
        `  Guest:     ${guestEmail || "missing"} (${booking.guest?.first_name || "?"})`,
      );
      console.log(
        `  Host:      ${hostEmail || "missing"} (${booking.Car?.host?.first_name || "?"})`,
      );

      let otp;

      try {
        otp = await createPickupOtp(booking);
      } catch (err) {
        console.error(
          `Error creating OTP for booking ${bookingId}:`,
          err.message,
        );
        continue;
      }

      if (!otp) {
        console.log(
          `→ No OTP generated (likely already exists or invalid timing)`,
        );
        continue;
      }

      console.log(`→ Generated OTP: ${otp}`);

      // Send to guest
      if (guestEmail) {
        try {
          await sendPickupOtpMail(guestEmail, otp, bookingId);
          console.log(`→ Email sent to guest: ${guestEmail}`);
        } catch (err) {
          console.error(
            `Failed to send guest email for booking ${bookingId}:`,
            err.message,
          );
        }
      } else {
        console.log(`→ No guest email available`);
      }

      // Send to host
      if (hostEmail) {
        try {
          await sendPickupOtpMail(hostEmail, otp, bookingId);
          console.log(`→ Email sent to host: ${hostEmail}`);
        } catch (err) {
          console.error(
            `Failed to send host email for booking ${bookingId}:`,
            err.message,
          );
        }
      } else {
        console.log(`→ No host email available`);
      }

      console.log(`✅ Finished processing booking #${bookingId}`);
    }

    console.log("✅ Pickup OTP cron finished successfully");
  } catch (err) {
    console.error("❌ Pickup OTP cron crashed:", err);
  }
});
