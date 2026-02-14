// const razorpay = require("../services/razorpay.service");
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

exports.getMyPayments = async (req, res) => {
  // req.user comes from your JWT middleware (see below if you don't have it yet)
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Booking,
          as: "Booking",
          where: { guest_id: userId }, // ← only this user's bookings
          required: true, // inner join → skip payments without matching booking
          attributes: [
            "id",
            "booking_type",
            "total_amount",
            "paid_amount",
            "status",
            "createdAt",
          ],
        },
      ],
      order: [["createdAt", "DESC"]], // newest first
      attributes: [
        "id",
        "amount",
        "currency",
        "payment_method",
        "payment_gateway_order_id",
        "payment_gateway_payment_id",
        "status",
        "createdAt",
        "updatedAt",
      ],
    });

    // Format response (clean, safe, no sensitive internal fields)
    const formatted = payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.payment_method,
      razorpay_order_id: payment.payment_gateway_order_id,
      razorpay_payment_id: payment.payment_gateway_payment_id,
      status: payment.status,
      paid_at: payment.createdAt,
      booking: {
        id: payment.Booking.id,
        type: payment.Booking.booking_type,
        total: payment.Booking.total_amount,
        paid: payment.Booking.paid_amount,
        booking_status: payment.Booking.status,
        car: payment.Booking.Car
          ? {
              make: payment.Booking.Car.make,
              model: payment.Booking.Car.model,
              year: payment.Booking.Car.year,
            }
          : null,
      },
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("[getMyPayments] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
