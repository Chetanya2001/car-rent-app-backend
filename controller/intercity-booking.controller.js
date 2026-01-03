const { Car, IntercityBooking, User, CarPhoto } = require("../models");
const nodemailer = require("nodemailer");

// ================= Transporter =================
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ================= Search Intercity Cars =================
// (Reuse same logic – intercity cars are still cars)
exports.searchIntercityCars = async (req, res) => {
  try {
    const { city } = req.body;

    if (!city) {
      return res.status(400).json({ message: "Pickup city is required" });
    }

    const cars = await Car.findAll({
      include: ["location"],
      where: { is_active: true },
    });

    res.status(200).json({ cars });
  } catch (error) {
    res.status(500).json({
      message: "Error searching intercity cars",
      error: error.message,
    });
  }
};

// ================= Book Intercity Car =================
exports.bookIntercityCar = async (req, res) => {
  try {
    const guest_id = req.user.id;

    const {
      car_id,
      pickup_datetime,
      pickup_city,
      pickup_station,
      drop_city,
      drop_station,
      pax,
      luggage,
      distance_km,
      base_fare,
      driver_amount,
      insure_amount,
      total_amount,
    } = req.body;

    // ---------- Validation ----------
    if (
      !car_id ||
      !pickup_datetime ||
      !pickup_city ||
      !pickup_station ||
      !drop_city ||
      !pax ||
      !luggage ||
      !base_fare ||
      !driver_amount ||
      !total_amount
    ) {
      return res.status(400).json({
        message: "Missing required intercity booking fields",
      });
    }

    // ---------- Fetch Guest ----------
    const guest = await User.findByPk(guest_id);
    if (!guest) return res.status(404).json({ message: "Guest not found" });

    // ---------- Fetch Car ----------
    const car = await Car.findByPk(car_id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    // ---------- Fetch Host ----------
    const host = await User.findByPk(car.host_id);
    if (!host) return res.status(404).json({ message: "Host not found" });

    // ---------- Email Content ----------
    const guestMail = {
      from: `"Zip Drive Support Team" <${process.env.EMAIL_USER}>`,
      to: guest.email,
      subject: "Intercity booking initiated",
      html: `
        <h3>Dear ${guest.first_name},</h3>
        <p>Your intercity booking has been initiated.</p>
        <p><b>Pickup:</b> ${pickup_city} - ${pickup_station}</p>
        <p><b>Drop:</b> ${drop_city}${
        drop_station ? " - " + drop_station : ""
      }</p>
        <p><b>Date & Time:</b> ${pickup_datetime}</p>
        <p><b>Passengers:</b> ${pax}</p>
        <p><b>Luggage:</b> ${luggage}</p>
        <p><b>Total Amount:</b> ₹${total_amount}</p>
        <p>Driver & insurance included.</p>
      `,
    };

    const hostMail = {
      from: `"Zip Drive Support Team" <${process.env.EMAIL_USER}>`,
      to: host.email,
      subject: "New intercity booking for your car",
      html: `
        <h3>Dear ${host.first_name},</h3>
        <p>Your car has been booked for an intercity trip.</p>
        <p><b>Pickup:</b> ${pickup_city} - ${pickup_station}</p>
        <p><b>Drop:</b> ${drop_city}</p>
        <p><b>Date & Time:</b> ${pickup_datetime}</p>
        <p>Please coordinate with the driver.</p>
      `,
    };

    // ---------- Send Emails ----------
    await Promise.all([
      transporter.sendMail(guestMail),
      transporter.sendMail(hostMail),
    ]);

    // ---------- Create Booking ----------
    const booking = await IntercityBooking.create({
      guest_id,
      car_id,
      pickup_datetime,
      pickup_city,
      pickup_station,
      drop_city,
      drop_station: drop_station || null,
      pax,
      luggage,
      distance_km: distance_km || null,
      base_fare,
      driver_amount,
      insure_amount: insure_amount || 0,
      total_amount,
      status: "initiated",
    });

    return res.status(201).json({
      message: "Intercity booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Intercity booking error:", error);
    res.status(500).json({
      message: "Error creating intercity booking",
      error: error.message,
    });
  }
};

// ================= Guest: My Intercity Bookings =================
exports.getGuestIntercityBookings = async (req, res) => {
  try {
    const guest_id = req.user.id;

    const bookings = await IntercityBooking.findAll({
      where: { guest_id },
      include: [
        {
          model: Car,
          include: [
            {
              model: CarPhoto,
              as: "photos",
              attributes: ["id", "photo_url"],
            },
            {
              model: User,
              as: "host",
              attributes: ["id", "first_name", "last_name", "email"],
            },
          ],
        },
      ],
      order: [["pickup_datetime", "DESC"]],
    });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching intercity bookings",
      error: error.message,
    });
  }
};

// ================= Admin: All Intercity Bookings =================
exports.getAllIntercityBookingsAdmin = async (req, res) => {
  try {
    const bookings = await IntercityBooking.findAll({
      include: [
        {
          model: Car,
          include: [{ model: User, as: "host" }],
        },
        {
          model: User,
          as: "guest",
        },
      ],
      order: [["pickup_datetime", "DESC"]],
    });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching all intercity bookings",
      error: error.message,
    });
  }
};

// ================= Update Status =================
exports.updateIntercityBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await IntercityBooking.findByPk(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = status;
    await booking.save();

    res.json({
      message: "Intercity booking updated",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update intercity booking",
      error: error.message,
    });
  }
};
