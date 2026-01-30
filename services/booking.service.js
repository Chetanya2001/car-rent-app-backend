const {
  sequelize,
  Booking,
  SelfDriveBooking,
  IntercityBooking,
  Payment,
} = require("../models");
const { Op } = require("sequelize");

/* =====================================================
   SELF DRIVE BOOKING (ZERO PAYMENT CONFIRM)
===================================================== */
exports.createSelfDriveBooking = async (data) => {
  return sequelize.transaction(async (t) => {
    // 🔒 Prevent double booking (basic lock)
    const conflict = await Booking.findOne({
      where: {
        car_id: data.car_id,
        status: {
          [Op.in]: ["CONFIRMED", "ACTIVE"],
        },
      },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (conflict) {
      throw new Error("Car already booked");
    }

    // 1️⃣ Create booking (CONFIRMED)
    const booking = await Booking.create(
      {
        guest_id: data.guest_id,
        car_id: data.car_id,
        booking_type: "SELF_DRIVE",

        status: "CONFIRMED",
        total_amount: data.total_amount,
        paid_amount: 0,
        payment_status: "PAID",
      },
      { transaction: t },
    );

    // 2️⃣ Create self-drive details
    const selfDrive = await SelfDriveBooking.create(
      {
        ...data.selfDrive,
        booking_id: booking.id,
      },
      { transaction: t },
    );

    // 3️⃣ Create ZERO payment record
    await Payment.create(
      {
        booking_id: booking.id,
        amount: 0,
        payment_method: "ZERO_RS",
        status: "SUCCESS",
      },
      { transaction: t },
    );

    return { booking, selfDrive };
  });
};

/* =====================================================
   INTERCITY BOOKING (ZERO PAYMENT CONFIRM)
===================================================== */
exports.createIntercityBooking = async (data) => {
  return sequelize.transaction(async (t) => {
    // 🔒 Prevent double booking
    const conflict = await Booking.findOne({
      where: {
        car_id: data.car_id,
        status: {
          [Op.in]: ["CONFIRMED", "ACTIVE"],
        },
      },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (conflict) {
      throw new Error("Car already booked");
    }

    // 1️⃣ Create booking
    const booking = await Booking.create(
      {
        guest_id: data.guest_id,
        car_id: data.car_id,
        booking_type: "INTERCITY",

        status: "CONFIRMED",
        total_amount: data.total_amount,
        paid_amount: 0,
        payment_status: "PAID",
      },
      { transaction: t },
    );

    // 2️⃣ Create intercity details
    const intercity = await IntercityBooking.create(
      {
        ...data.intercity,
        booking_id: booking.id,
      },
      { transaction: t },
    );

    // 3️⃣ Create ZERO payment record
    await Payment.create(
      {
        booking_id: booking.id,
        amount: 0,
        payment_method: "ZERO_RS",
        status: "SUCCESS",
      },
      { transaction: t },
    );

    return { booking, intercity };
  });
};
