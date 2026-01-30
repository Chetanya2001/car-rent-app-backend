const { BookingOTP, SelfDriveBooking, IntercityBooking } = require("../models");

const { generateOTP } = require("../utils/otp.util");

exports.createPickupOtp = async (booking) => {
  console.log("🟢 OTP service called for booking:", booking.id);

  const existingOtp = await BookingOTP.findOne({
    where: {
      booking_id: booking.id,
      otp_type: "PICKUP",
    },
  });

  if (existingOtp && existingOtp.expires_at > new Date()) {
    console.log("🟠 Valid OTP already exists");
    return null;
  }

  let pickupTime;

  // 🔥 THIS IS THE FIX
  if (booking.booking_type === "SELF_DRIVE") {
    const selfDrive = await SelfDriveBooking.findOne({
      where: { booking_id: booking.id },
    });

    if (!selfDrive) {
      console.error("❌ SelfDriveBooking not found");
      return null;
    }

    pickupTime = selfDrive.start_datetime;
  }

  if (booking.booking_type === "INTERCITY") {
    const intercity = await IntercityBooking.findOne({
      where: { booking_id: booking.id },
    });

    if (!intercity) {
      console.error("❌ IntercityBooking not found");
      return null;
    }

    pickupTime = intercity.start_datetime;
  }

  if (!pickupTime) {
    console.error("❌ Pickup time missing");
    return null;
  }

  const otp = generateOTP();

  await BookingOTP.create({
    booking_id: booking.id,
    otp_type: "PICKUP",
    otp_code: otp,
    expires_at: pickupTime,
  });

  console.log("✅ OTP created for booking:", booking.id);

  return otp;
};

exports.createDropOtp = async (booking) => {
  console.log("🏁 Drop OTP service called for booking:", booking.id);

  const existingOtp = await BookingOTP.findOne({
    where: {
      booking_id: booking.id,
      otp_type: "DROP",
    },
  });

  if (existingOtp && existingOtp.expires_at > new Date()) {
    console.log("🟠 Valid DROP OTP already exists");
    return null;
  }

  let dropTime;

  if (booking.booking_type === "SELF_DRIVE") {
    const selfDrive = await SelfDriveBooking.findOne({
      where: { booking_id: booking.id },
    });

    if (!selfDrive) {
      console.error("❌ SelfDriveBooking not found");
      return null;
    }

    dropTime = selfDrive.end_datetime;
  }

  if (booking.booking_type === "INTERCITY") {
    const intercity = await IntercityBooking.findOne({
      where: { booking_id: booking.id },
    });

    if (!intercity) {
      console.error("❌ IntercityBooking not found");
      return null;
    }

    dropTime = intercity.end_datetime; // adjust if different field
  }

  if (!dropTime) {
    console.error("❌ Drop time missing");
    return null;
  }

  const otp = generateOTP();

  await BookingOTP.create({
    booking_id: booking.id,
    otp_type: "DROP",
    otp_code: otp,
    expires_at: dropTime,
  });

  console.log("✅ DROP OTP created:", booking.id);

  return otp;
};
