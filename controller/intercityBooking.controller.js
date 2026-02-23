const { User, Car } = require("../models");
const bookingService = require("../services/booking.service");
const { sendBookingEmails } = require("../services/booking-mail.service");

exports.bookIntercity = async (req, res) => {
  try {
    const guest_id = req.user.id;

    const {
      car_id,
      total_amount,
      pickup_address,
      pickup_lat,
      pickup_long,
      drop_address,
      drop_lat,
      drop_long,
      pax,
      luggage,
      distance_km,
      driver_amount,
      pickup_datetime,
    } = req.body;

    const guest = await User.findByPk(guest_id);
    const car = await Car.findByPk(car_id, {
      include: [{ model: User, as: "host" }],
    });

    if (!guest || !car) {
      return res.status(404).json({ message: "Guest or Car not found" });
    }

    const result = await bookingService.createIntercityBooking({
      guest_id,
      car_id,
      total_amount,
      intercity: {
        pickup_address,
        pickup_lat,
        pickup_long,
        drop_address,
        drop_lat,
        drop_long,
        pax,
        luggage,
        distance_km,
        driver_amount,
        pickup_datetime,
      },
    });

    await sendBookingEmails({
      guest,
      host: car.host,
      booking: result.booking,
    });

    res.status(201).json({
      message: "Intercity booking created",
      booking: result.booking,
      intercity: result.intercityBooking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
