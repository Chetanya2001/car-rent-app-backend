const { Booking, BookingOTP } = require("../models");
const { generateOTP } = require("../utils/otp.util");

exports.createPickupOtp = async (booking) => {
  const existingOtp = await BookingOTP.findOne({
    where: {
      booking_id: booking.id,
      otp_type: "PICKUP",
    },
  });

  if (existingOtp && existingOtp.expires_at > new Date()) {
    return null;
  }

  const otp = generateOTP();

  const expiresAt = new Date(booking.pickup_datetime);

  await BookingOTP.upsert({
    booking_id: booking.id,
    otp_type: "PICKUP",
    otp_code: otp, // (later hash this)
    expires_at: expiresAt,
    verified_at: null,
    verified_by: null,
  });

  return otp;
};
