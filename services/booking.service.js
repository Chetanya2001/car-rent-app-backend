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

    /* -------------------- CONFLICT CHECK (CROSS MODE) -------------------- */
    const [rows] = await sequelize.query(
      `
      SELECT b.id
      FROM Bookings b
      LEFT JOIN SelfDriveBookings sdb
        ON sdb.booking_id = b.id
      LEFT JOIN IntercityBookings ib
        ON ib.booking_id = b.id
      WHERE b.car_id = :car_id
        AND b.status IN ('CONFIRMED','ACTIVE')
        AND (
          (sdb.start_datetime < :new_end AND sdb.end_datetime > :new_start)
          OR
          (ib.pickup_datetime < :new_end AND ib.drop_datetime > :new_start)
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

    /* -------------------- CREATE BOOKING -------------------- */
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

    /* -------------------- CREATE SELF DRIVE DETAILS -------------------- */
    const selfDrive = await SelfDriveBooking.create(
      {
        ...data.selfDrive,
        booking_id: booking.id,
        total_amount: data.total_amount,
      },
      { transaction: t },
    );

    /* -------------------- ZERO PAYMENT -------------------- */
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
    console.log(data.intercity.pickup_datetime);
    console.log(data.intercity.drop_datetime);
    const pickupISO = new Date(data.intercity.pickup_datetime).toISOString();

    const dropISO = new Date(data.intercity.drop_datetime).toISOString();

    /* -------------------- CONFLICT CHECK (CROSS MODE) -------------------- */
    const [rows] = await sequelize.query(
      `
      SELECT b.id
      FROM Bookings b
      LEFT JOIN SelfDriveBookings sdb
        ON sdb.booking_id = b.id
      LEFT JOIN IntercityBookings ib
        ON ib.booking_id = b.id
      WHERE b.car_id = :car_id
        AND b.status IN ('CONFIRMED','ACTIVE')
        AND (
          (sdb.start_datetime < :new_drop AND sdb.end_datetime > :new_pickup)
          OR
          (ib.pickup_datetime < :new_drop AND ib.drop_datetime > :new_pickup)
        )
      FOR UPDATE
      `,
      {
        replacements: {
          car_id: data.car_id,
          new_pickup: pickupISO,
          new_drop: dropISO,
        },
        transaction: t,
      },
    );

    if (rows.length > 0) {
      throw new Error("Car already booked in this time range");
    }

    /* -------------------- CREATE BOOKING -------------------- */
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

    /* -------------------- CREATE INTERCITY DETAILS -------------------- */
    const intercity = await IntercityBooking.create(
      {
        ...data.intercity,
        booking_id: booking.id,
      },
      { transaction: t },
    );

    /* -------------------- ZERO PAYMENT -------------------- */
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
