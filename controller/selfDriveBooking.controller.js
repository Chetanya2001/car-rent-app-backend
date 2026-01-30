const { User, Car, sequelize } = require("../models");
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

    /* -------------------- VALIDATE INPUT -------------------- */

    if (!car_id || !start_datetime || !end_datetime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const pickupDate = new Date(start_datetime);
    const dropoffDate = new Date(end_datetime);

    if (
      isNaN(pickupDate.getTime()) ||
      isNaN(dropoffDate.getTime()) ||
      dropoffDate <= pickupDate
    ) {
      return res.status(400).json({ message: "Invalid booking time range" });
    }

    const hours = Math.max(
      1,
      Math.ceil((dropoffDate - pickupDate) / (1000 * 60 * 60)),
    );

    // ✅ Always use ISO strings for SQL
    const pickupISO = pickupDate.toISOString();
    const dropoffISO = dropoffDate.toISOString();

    /* -------------------- LOAD MODELS FIRST -------------------- */

    const guest = await User.findByPk(guest_id);

    const car = await Car.findByPk(car_id, {
      include: [{ model: User, as: "host" }],
    });

    if (!guest || !car) {
      return res.status(404).json({ message: "Guest or Car not found" });
    }

    /* -------------------- CONFLICT CHECK (MATCHES SEARCH LOGIC) -------------------- */

    const [rows] = await sequelize.query(
      `
      SELECT 1
      FROM Bookings b
      INNER JOIN SelfDriveBookings sdb
        ON sdb.booking_id = b.id
      WHERE b.car_id = :car_id
        AND b.booking_type = 'SELF_DRIVE'
        AND b.status IN ('CONFIRMED','ACTIVE')
        AND (
          (sdb.start_datetime <= :pickup AND sdb.end_datetime >= :pickup)
          OR
          (sdb.start_datetime <= :dropoff AND sdb.end_datetime >= :dropoff)
          OR
          (sdb.start_datetime >= :pickup AND sdb.end_datetime <= :dropoff)
        )
      LIMIT 1
      `,
      {
        replacements: {
          car_id,
          pickup: pickupISO,
          dropoff: dropoffISO,
        },
      },
    );

    if (rows.length > 0) {
      return res.status(409).json({
        message:
          "Car is already booked in your selected time. Please choose a different time.",
      });
    }

    /* -------------------- BACKEND PRICING (SOURCE OF TRUTH) -------------------- */

    const hourlyRate = car.price_per_hour || 100;

    const base = hourlyRate * hours;
    const insurance = Number(insure_amount || 0);
    const driver = Number(driver_amount || 0);
    const drop = Number(drop_charge || 0);

    const subtotal = base + insurance + driver + drop;
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;

    /* -------------------- CREATE BOOKING -------------------- */

    const result = await bookingService.createSelfDriveBooking({
      guest_id,
      car_id,
      total_amount: total,

      selfDrive: {
        start_datetime: pickupISO,
        end_datetime: dropoffISO,

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

    return res.status(201).json({
      message: "Self-drive booking created",
      booking: result.booking,
      selfDrive: result.selfDriveBooking,
      pricing: {
        hours,
        base,
        insurance,
        driver,
        drop,
        gst,
        total,
      },
    });
  } catch (err) {
    console.error("SelfDrive Booking Error:", err);
    return res.status(500).json({ message: err.message });
  }
};
