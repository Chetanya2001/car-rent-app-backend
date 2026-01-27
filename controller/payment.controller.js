const razorpay = require("../config/razorpay");
const { sequelize, Booking, Payment } = require("../models");

exports.createOrder = async (req, res) => {
  try {
    const { booking_id } = req.body;

    const booking = await Booking.findByPk(booking_id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.total_amount === 0) {
      return res.json({
        is_zero_payment: true,
        message: "Zero amount booking",
      });
    }

    const order = await razorpay.orders.create({
      amount: booking.total_amount * 100, // paise
      currency: "INR",
      receipt: `booking_${booking.id}`,
    });

    return res.json({
      is_zero_payment: false,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Order creation failed" });
  }
};

exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    booking_id,
  } = req.body;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid payment signature" });
  }

  await sequelize.transaction(async (t) => {
    const booking = await Booking.findByPk(booking_id, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!booking) throw new Error("Booking not found");

    // Save payment
    await Payment.create(
      {
        booking_id,
        amount: booking.total_amount,
        payment_method: "RAZORPAY",
        payment_gateway_order_id: razorpay_order_id,
        payment_gateway_payment_id: razorpay_payment_id,
        status: "SUCCESS",
      },
      { transaction: t },
    );

    // Confirm booking
    booking.paid_amount = booking.total_amount;
    booking.payment_status = "PAID";
    booking.status = "CONFIRMED";

    await booking.save({ transaction: t });
  });

  res.json({ message: "Payment verified & booking confirmed" });
};
exports.zeroPaymentConfirm = async (req, res) => {
  const { booking_id } = req.body;

  await sequelize.transaction(async (t) => {
    const booking = await Booking.findByPk(booking_id, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!booking) throw new Error("Booking not found");

    await Payment.create(
      {
        booking_id,
        amount: 0,
        payment_method: "ZERO_RS",
        status: "SUCCESS",
      },
      { transaction: t },
    );

    booking.status = "CONFIRMED";
    booking.paid_amount = 0;
    booking.payment_status = "PAID";

    await booking.save({ transaction: t });
  });

  res.json({ message: "Zero payment booking confirmed" });
};
