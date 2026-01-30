const { User, Car, Sequelize } = require("../models");
const { Op } = require("sequelize");
const bookingService = require("../services/booking.service");
const { sendBookingEmails } = require("../services/booking-mail.service");

exports.bookSelfDrive = async (req, res) => {
  try {
    const guest_id = req.user.id;

    const {
      car_id,
      start_datetime,
      end_datetime,
      pickup_address,
      pickup_lat,
      pickup_long,
      drop_address,
      drop_lat,
      drop_long,

      insure_amount,
      driver_amount,
      drop_charge,
    } = req.body;

    /* -------------------- VALIDATE TIME -------------------- */

    if (!start_datetime || !end_datetime) {
      return res.status(400).json({ message: "Datetime required" });
    }

    const pickup = new Date(start_datetime);
    const dropoff = new Date(end_datetime);

    if (isNaN(pickup) || isNaN(dropoff) || dropoff <= pickup) {
      return res.status(400).json({ message: "Invalid booking time range" });
    }

    const hours = Math.max(1, Math.ceil((dropoff - pickup) / (1000 * 60 * 60)));

    /* -------------------- LOAD MODELS FIRST -------------------- */

    const guest = await User.findByPk(guest_id);

    const car = await Car.findByPk(car_id, {
      include: [{ model: User, as: "host" }],
    });

    if (!guest || !car) {
      return res.status(404).json({ message: "Guest or Car not found" });
    }

    /* -------------------- CONFLICT CHECK -------------------- */

    const conflict = await Car.findOne({
      where: {
        id: car_id,
        id: {
          [Op.in]: Sequelize.literal(`
            (
              SELECT b.car_id
              FROM Bookings b
              INNER JOIN SelfDriveBookings sdb
                ON sdb.booking_id = b.id
              WHERE b.car_id = ${car_id}
                AND b.status IN ('CONFIRMED', 'ACTIVE')
                AND b.booking_type = 'SELF_DRIVE'
                AND (
                  sdb.start_datetime < '${dropoff.toISOString()}'
                  AND sdb.end_datetime > '${pickup.toISOString()}'
                )
            )
          `),
        },
      },
    });

    if (conflict) {
      return res.status(409).json({
        message:
          "Car is already booked in your selected time. Please choose a different time.",
      });
    }

    /* -------------------- BACKEND PRICING (SOURCE OF TRUTH) -------------------- */

    const hourlyRate = car.price_per_hour;

    const base = hourlyRate * hours;
    const insurance = insure_amount || 0;
    const driver = driver_amount || 0;
    const drop = drop_charge || 0;

    const subtotal = base + insurance + driver + drop;
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;

    /* -------------------- CREATE BOOKING -------------------- */

    const result = await bookingService.createSelfDriveBooking({
      guest_id,
      car_id,
      total_amount: total,

      selfDrive: {
        start_datetime,
        end_datetime,
        pickup_address,
        pickup_lat,
        pickup_long,
        drop_address,
        drop_lat,
        drop_long,

        insure_amount: insurance,
        driver_amount: driver,
        drop_charge: drop,
        base_amount: base,
        gst_amount: gst,
        hourly_rate_snapshot: hourlyRate,
      },
    });

    /* -------------------- EMAILS -------------------- */

    await sendBookingEmails({
      guest,
      host: car.host,
      booking: result.booking,
    });

    /* -------------------- RESPONSE -------------------- */

    res.status(201).json({
      message: "Self-drive booking created",
      booking: result.booking,
      selfDrive: result.selfDrive,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
