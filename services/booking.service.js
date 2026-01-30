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
    const startISO = new Date(data.selfDrive.start_datetime).toISOString();
    const endISO = new Date(data.selfDrive.end_datetime).toISOString();

    /* ✅ TIME OVERLAP CONFLICT CHECK */
    const [rows] = await sequelize.query(
      `
      SELECT b.id
      FROM Bookings b
      INNER JOIN SelfDriveBookings sdb
        ON sdb.booking_id = b.id
      WHERE b.car_id = :car_id
        AND b.booking_type = 'SELF_DRIVE'
        AND b.status IN ('CONFIRMED','ACTIVE')
        AND (
          sdb.start_datetime < :new_end
          AND
          sdb.end_datetime   > :new_start
        )
      FOR UPDATE
      `,
      {
        replacements: {
          car_id: data.car_id,
          new_start: startISO,
          new_end: endISO,
        },
        transaction: t,
      },
    );

    if (rows.length > 0) {
      throw new Error("Car already booked in this time range");
    }

    /* ✅ CREATE BOOKING */
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

    /* ✅ SELF DRIVE RECORD */
    const selfDrive = await SelfDriveBooking.create(
      {
        ...data.selfDrive,
        booking_id: booking.id,
      },
      { transaction: t },
    );

    /* ✅ ZERO PAYMENT */
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
