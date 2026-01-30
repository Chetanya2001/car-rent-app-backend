const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendBookingEmails = async ({ guest, host, booking }) => {
  const guestMail = {
    from: `"Zip Drive Support" <${process.env.EMAIL_USER}>`,
    to: guest.email,
    subject: "Booking Initiated",
    html: `
      <h3>Hello ${guest.first_name}</h3>
      <p>Your booking (#${booking.id}) has been initiated.</p>
    `,
  };

  const hostMail = {
    from: `"Zip Drive Support" <${process.env.EMAIL_USER}>`,
    to: host.email,
    subject: "New Booking Alert",
    html: `
      <h3>Hello ${host.first_name}</h3>
      <p>Your car has been booked.</p>
    `,
  };

  await Promise.all([
    transporter.sendMail(guestMail),
    transporter.sendMail(hostMail),
  ]);
};
exports.sendPickupOtpMail = async (email, otp, bookingId) => {
  const subject = "Pickup OTP - Zipdrive";
  const html = `
    <h2>Pickup OTP</h2>
    <p>Booking ID: <strong>${bookingId}</strong></p>
    <p>OTP: <strong style="font-size:20px">${otp}</strong></p>
    <p>Share this OTP with the guest at pickup.</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Zip Drive Support" <${process.env.EMAIL_USER}>`, // ← add from here too (good practice)
      to: email,
      subject,
      html,
    });

    console.log(`[EMAIL SUCCESS] to ${email} for booking ${bookingId}`);
    console.log("→ Message ID:", info.messageId);
    console.log("→ Accepted:", info.accepted);
    console.log("→ Rejected:", info.rejected);
    console.log("→ Response:", info.response);
    console.log("→ Full envelope:", JSON.stringify(info.envelope, null, 2));

    return info;
  } catch (err) {
    console.error(`[EMAIL FAILED] to ${email}:`, err);
    throw err;
  }
};
exports.sendDropOtpMail = async (email, otp, bookingId) => {
  await sendMail({
    to: email,
    subject: `Drop OTP for Booking #${bookingId}`,
    html: `
      <h2>Booking Drop Verification</h2>
      <p>Your drop OTP is:</p>
      <h1>${otp}</h1>
      <p>Enter this OTP to complete the booking.</p>
    `,
  });
};
