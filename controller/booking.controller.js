const {
  Booking,
  Car,
  User,
  SelfDriveBooking,
  IntercityBooking,
  CarPhoto,
  CarMake,
  CarModel,
} = require("../models");

/**
 * GUEST BOOKINGS
 */
exports.getGuestBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { guest_id: req.user.id },

      attributes: ["id", "status", "booking_type", "total_amount", "createdAt"],

      include: [
        {
          model: Car,
          attributes: ["id", "description", "year"],
          include: [
            {
              model: User,
              as: "host",
              attributes: ["id", "first_name", "last_name", "phone"],
            },
            {
              model: CarPhoto,
              as: "photos",
              attributes: ["id", "photo_url"],
              separate: true,
              order: [["id", "ASC"]],
            },
            {
              model: CarMake,
              as: "make",
              attributes: ["name"],
            },
            {
              model: CarModel,
              as: "model",
              attributes: ["name"],
            },
          ],
        },

        // ✅ Only trip info — NO pricing breakdown
        {
          model: SelfDriveBooking,
          attributes: [
            "start_datetime",
            "end_datetime",
            "pickup_address",
            "drop_address",
          ],
        },

        {
          model: IntercityBooking,
          attributes: ["pickup_address", "drop_address", "distance_km"],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * HOST BOOKINGS
 */
exports.getHostBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        {
          model: Car,
          where: { host_id: req.user.id },
          required: true,
          attributes: ["id", "description", "year"],

          include: [
            {
              model: CarPhoto,
              as: "photos",
              attributes: ["id", "photo_url"],
              separate: true,
              order: [["id", "ASC"]],
            },
            {
              model: CarMake,
              as: "make",
              attributes: ["name"],
            },
            {
              model: CarModel,
              as: "model",
              attributes: ["name"],
            },
          ],
        },

        // ✅ FULL pricing for host
        {
          model: SelfDriveBooking,
          attributes: [
            "start_datetime",
            "end_datetime",
            "pickup_address",
            "drop_address",

            "base_amount",
            "insure_amount",
            "driver_amount",
            "drop_charge",
            "gst_amount",
            "total_amount",
          ],
        },

        {
          model: IntercityBooking,
          attributes: { exclude: [] }, // full allowed
        },

        {
          model: User,
          as: "guest",
          attributes: ["id", "first_name", "last_name", "phone"],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ADMIN BOOKINGS
 */
exports.getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        Car,
        { model: User, as: "guest" },
        SelfDriveBooking,
        IntercityBooking,
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * EDIT BOOKING STATUS / AMOUNT
 */
exports.editBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const { status, total_amount } = req.body;

    if (status) booking.status = status;
    if (total_amount !== undefined) booking.total_amount = total_amount;

    await booking.save();

    res.json({ message: "Booking updated", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE BOOKING
 */
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await booking.destroy();
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
