// ✅ Correct
const { Car, CarLocation, Booking, User, CarPhoto } = require("../models");
const nodemailer = require("nodemailer");

// ✅ Define transporter globally (before exports)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g. smtp.hostinger.com
  port: process.env.EMAIL_PORT, // 465 or 587
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

exports.bookCar = async (req, res) => {
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
    } = req.body;

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

    // Create booking
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
      status: "initiated",
    });

    // Fetch guest info
    const guest = await User.findByPk(guest_id);

    const car = await Car.findByPk(car_id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    const host = await User.findByPk(car.host_id);
    if (!host) {
      return res.status(404).json({ message: "Host not found" });
    }

    // Email content for guest
    const guestMailOptions = {
      from: `"Zip Drive Support Team" <${process.env.EMAIL_USER}>`,
      to: guest.email,
      subject: `Your booking for car ${car_id} is confirmed`,
      html: `
        <h3>Dear ${guest.first_name},</h3>
        <p>Your booking for the car (ID: ${car_id}) has been successfully initiated.</p>
        <p>Pickup: ${pickup_address}</p>
        <p>Drop: ${drop_address}</p>
        <p>From: ${start_datetime} To: ${end_datetime}</p>
        <p>Thank you for choosing Zip Drive!</p>
      `,
    };

    // Email content for host
    const hostMailOptions = {
      from: `"Zip Drive Support Team" <${process.env.EMAIL_USER}>`,
      to: host.email,
      subject: `Your car (ID: ${car_id}) has been booked`,
      html: `
        <h3>Dear ${host.first_name},</h3>
        <p>Your car (ID: ${car_id}) has been booked by ${guest.first_name} ${guest.last_name}.</p>
        <p>Pickup: ${pickup_address}</p>
        <p>Drop: ${drop_address}</p>
        <p>From: ${start_datetime} To: ${end_datetime}</p>
        <p>Please prepare the car for the rental period.</p>
      `,
    };
    console.log(transporter);
    // Send emails (can be done in parallel)
    await Promise.all([
      transporter.sendMail(guestMailOptions),
      transporter.sendMail(hostMailOptions),
    ]);

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
    const bookings = await Booking.findAll({
      include: [
        {
          model: Car,
          include: [{ model: User, as: "host" }], // assuming host user association
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
      .json({ message: "Error fetching all bookings", error: error.message });
  }
};

// ========== Host: Get My Cars' Bookings ==========
exports.getHostBookings = async (req, res) => {
  try {
    const host_id = req.user.id; // Assuming this is host's user ID

    // Find bookings for cars owned by this host including photos
    const bookings = await Booking.findAll({
      include: [
        {
          model: Car,
          where: { host_id }, // Only cars owned by current host
          required: true,
          include: [
            {
              model: CarPhoto,
              as: "photos",
              attributes: ["id", "photo_url"],
            },
          ],
        },
        {
          model: User,
          as: "guest", // Match association alias
          attributes: ["id", "first_name", "last_name", "email"],
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
