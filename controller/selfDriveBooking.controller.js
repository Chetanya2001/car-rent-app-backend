const { User, Car } = require("../models");
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

    const guest = await User.findByPk(guest_id);
    const car = await Car.findByPk(car_id, {
      include: [{ model: User, as: "host" }],
    });

    if (!guest || !car) {
      return res.status(404).json({ message: "Guest or Car not found" });
    }

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
