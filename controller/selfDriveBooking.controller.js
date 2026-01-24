const { User, Car, Sequelize } = require("../models");
const { Op } = require("sequelize");
const bookingService = require("../services/booking.service");
const { sendBookingEmails } = require("../services/booking-mail.service");

exports.bookSelfDrive = async (req, res) => {
  try {
    const guest_id = req.user.id;

    const {
      car_id,
      total_amount,
      start_datetime,
      end_datetime,
      pickup_address,
      pickup_lat,
      pickup_long,
      drop_address,
      drop_lat,
      drop_long,
      insure_amount,
    } = req.body;

    const pickup = new Date(start_datetime);
    const dropoff = new Date(end_datetime);

    const guest = await User.findByPk(guest_id);
    const car = await Car.findByPk(car_id, {
      include: [{ model: User, as: "host" }],
    });

    if (!guest || !car) {
      return res.status(404).json({ message: "Guest or Car not found" });
    }

    /* --------------------------------------------------
       🚫 BLOCK IF CAR ALREADY BOOKED IN SELECTED TIME
    -------------------------------------------------- */
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
                AND b.status IN ('initiated', 'booked')
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

    /* --------------------------------------------------
       ✅ CREATE BOOKING
    -------------------------------------------------- */
    const result = await bookingService.createSelfDriveBooking({
      guest_id,
      car_id,
      total_amount,
      selfDrive: {
        start_datetime,
        end_datetime,
        pickup_address,
        pickup_lat,
        pickup_long,
        drop_address,
        drop_lat,
        drop_long,
        insure_amount: insure_amount || 0,
      },
    });

    await sendBookingEmails({
      guest,
      host: car.host,
      booking: result.booking,
    });

    res.status(201).json({
      message: "Self-drive booking created",
      booking: result.booking,
      selfDrive: result.selfDriveBooking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
