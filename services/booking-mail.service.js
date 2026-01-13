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
