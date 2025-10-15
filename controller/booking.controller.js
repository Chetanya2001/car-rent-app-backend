// ✅ Correct
const { Car, CarLocation, Booking, User, CarPhoto } = require("../models");

// ========== SearchCars ==========
exports.SearchCars = async (req, res) => {
  try {
    const { city, start_datetime, end_datetime } = req.body;

    const cars = await Car.findAll({
      include: [
        {
          model: CarLocation,
          where: { city },
        },
      ],
    });

    res.status(200).json(cars);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error searching cars", error: error.message });
  }
};

// ========== ViewaCar ==========
exports.ViewaCar = async (req, res) => {
  try {
    const { car_id } = req.body;

    const car = await Car.findByPk(car_id, {
      include: [CarLocation],
    });

    if (!car) return res.status(404).json({ message: "Car not found" });

    res.status(200).json(car);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching car details", error: error.message });
  }
};

// ========== BookaCar ==========
// ========== BookaCar ==========
exports.bookCar = async (req, res) => {
  try {
    // Always take guest_id from JWT token
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
      insure_amount, // <- NEW FIELD
      driver_amount, // <- NEW FIELD
    } = req.body;

    // Validate required fields
    if (
      !car_id ||
      !start_datetime ||
      !end_datetime ||
      !pickup_address ||
      !pickup_lat ||
      !pickup_long ||
      !drop_address ||
      !drop_lat ||
      !drop_long
    ) {
      return res.status(400).json({
        message:
          "All of car_id, start_datetime, end_datetime, pickup and drop details are required",
      });
    }

    const booking = await Booking.create({
      guest_id,
      car_id,
      start_datetime,
      end_datetime,
      pickup_address,
      pickup_lat,
      pickup_long,
      drop_address,
      drop_lat,
      drop_long,
      insure_amount: insure_amount || 0,
      driver_amount: driver_amount || 0,
      status: "initiated", // default status
    });

    res.status(201).json({
      message: "Car booked successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating booking",
      error: error.message,
    });
  }
};
// ========== Admin: Get All Bookings ==========
exports.getAllBookingsAdmin = async (req, res) => {
  try {
    // Only allow admins - authorization middleware should ensure this
    const bookings = await Booking.findAll({
      include: [
        {
          model: Car,
          include: [{ model: User, as: "host" }], // assuming host user association
        },
        {
          model: Users,
          as: "guest",
        },
      ],
      order: [["start_datetime", "DESC"]],
    });
    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching all bookings", error: error.message });
  }
};

// ========== Host: Get My Cars' Bookings ==========
exports.getHostBookings = async (req, res) => {
  try {
    const host_id = req.user.id; // Assuming this is host's user ID

    // Find bookings for cars owned by this host
    const bookings = await Booking.findAll({
      include: [
        {
          model: Car,
          where: { host_id }, // filter cars by this host
        },
        {
          model: User,
          as: "guest",
        },
      ],
      order: [["start_datetime", "DESC"]],
    });
    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching host bookings", error: error.message });
  }
};

exports.getGuestBookings = async (req, res) => {
  try {
    const guest_id = req.user.id;

    const bookings = await Booking.findAll({
      where: { guest_id },
      include: [
        {
          model: Car,
          include: [
            {
              model: User,
              as: "host",
              attributes: ["id", "first_name", "last_name", "email"],
            },
            {
              model: CarPhoto,
              as: "photos",
              attributes: ["id", "photo_url"],
            },
          ],
        },
        {
          model: User,
          as: "guest",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
      order: [["start_datetime", "DESC"]],
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching guest bookings:", error);
    res.status(500).json({
      message: "Error fetching guest bookings",
      error: error.message,
    });
  }
};
