const {
  Booking,
  Car,
  User,
  SelfDriveBooking,
  IntercityBooking,
  CarPhoto,
  CarMake,
  CarModel,
  ServiceBooking,
  ServicePlan,
} = require("../models");

const shapeServiceBooking = (b) => ({
  booking_category: "service",
  id: b.id,
  status: b.status,
  scheduled_at: b.scheduled_at,
  completed_at: b.completed_at,
  total_price: b.total_price,
  notes: b.notes,
  createdAt: b.createdAt,
  car: {
    car_id: b.Car?.id ?? null,
    make: b.Car?.make?.name ?? null,
    model: b.Car?.model?.name ?? null,
    year: b.Car?.year ?? null,
    thumbnail: b.Car?.photos?.[0]?.photo_url ?? null,
  },
  plan: {
    name: b.ServicePlan?.name ?? null,
    code: b.ServicePlan?.code ?? null,
    price: b.ServicePlan?.price ?? null,
    duration_minutes: b.ServicePlan?.duration_minutes ?? null,
    description: b.ServicePlan?.description ?? null,
  },
});

const serviceBookingInclude = [
  {
    model: Car,
    attributes: ["id", "year"],
    include: [
      { model: CarMake, as: "make", attributes: ["name"] },
      { model: CarModel, as: "model", attributes: ["name"] },
      {
        model: CarPhoto,
        as: "photos",
        attributes: ["photo_url"],
        separate: true,
        order: [["id", "ASC"]],
        limit: 1,
      },
    ],
  },
  {
    model: ServicePlan,
    attributes: ["name", "code", "price", "duration_minutes", "description"],
  },
];

/**
 * GUEST BOOKINGS — returns { rental: [...], service: [...] }
 */
exports.getGuestBookings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [rentalBookings, serviceBookings] = await Promise.all([
      Booking.findAll({
        where: { guest_id: user_id },
        attributes: [
          "id",
          "status",
          "booking_type",
          "total_amount",
          "createdAt",
        ],
        include: [
          {
            model: Car,
            attributes: ["id", "description", "year"],
            include: [
              {
                model: User,
                as: "host",
                attributes: ["id", "first_name", "last_name", "phone", "email"],
              },
              {
                model: CarPhoto,
                as: "photos",
                attributes: ["id", "photo_url"],
                separate: true,
                order: [["id", "ASC"]],
              },
              { model: CarMake, as: "make", attributes: ["name"] },
              { model: CarModel, as: "model", attributes: ["name"] },
            ],
          },
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
      }),
      ServiceBooking.findAll({
        where: { user_id },
        include: serviceBookingInclude,
        order: [["createdAt", "DESC"]],
      }),
    ]);

    return res.status(200).json({
      rental: rentalBookings.map((b) => ({
        booking_category: "rental",
        id: b.id,
        status: b.status,
        booking_type: b.booking_type,
        total_amount: b.total_amount,
        createdAt: b.createdAt,
        car: {
          car_id: b.Car?.id ?? null,
          make: b.Car?.make?.name ?? null,
          model: b.Car?.model?.name ?? null,
          year: b.Car?.year ?? null,
          thumbnail: b.Car?.photos?.[0]?.photo_url ?? null,
        },
        self_drive: b.SelfDriveBooking
          ? {
              start_datetime: b.SelfDriveBooking.start_datetime,
              end_datetime: b.SelfDriveBooking.end_datetime,
              pickup_address: b.SelfDriveBooking.pickup_address,
              drop_address: b.SelfDriveBooking.drop_address,
            }
          : null,
        intercity: b.IntercityBooking
          ? {
              pickup_address: b.IntercityBooking.pickup_address,
              drop_address: b.IntercityBooking.drop_address,
              distance_km: b.IntercityBooking.distance_km,
            }
          : null,
      })),
      service: serviceBookings.map(shapeServiceBooking),
    });
  } catch (err) {
    console.error("Error fetching guest bookings:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * HOST BOOKINGS — returns { rental: [...], service: [...] }
 */
exports.getHostBookings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [rentalBookings, serviceBookings] = await Promise.all([
      Booking.findAll({
        include: [
          {
            model: Car,
            where: { host_id: user_id },
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
              { model: CarMake, as: "make", attributes: ["name"] },
              { model: CarModel, as: "model", attributes: ["name"] },
            ],
          },
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
          { model: IntercityBooking, attributes: { exclude: [] } },
          {
            model: User,
            as: "guest",
            attributes: ["id", "first_name", "last_name", "phone", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      }),
      ServiceBooking.findAll({
        where: { user_id },
        include: serviceBookingInclude,
        order: [["createdAt", "DESC"]],
      }),
    ]);

    return res.status(200).json({
      rental: rentalBookings.map((b) => ({
        booking_category: "rental",
        id: b.id,
        status: b.status,
        booking_type: b.booking_type,
        total_amount: b.total_amount,
        createdAt: b.createdAt,
        car: {
          car_id: b.Car?.id ?? null,
          make: b.Car?.make?.name ?? null,
          model: b.Car?.model?.name ?? null,
          year: b.Car?.year ?? null,
          thumbnail: b.Car?.photos?.[0]?.photo_url ?? null,
        },
        guest: b.guest
          ? {
              id: b.guest.id,
              name: `${b.guest.first_name || ""} ${b.guest.last_name || ""}`.trim(),
              phone: b.guest.phone,
              email: b.guest.email,
            }
          : null,
        self_drive: b.SelfDriveBooking
          ? {
              start_datetime: b.SelfDriveBooking.start_datetime,
              end_datetime: b.SelfDriveBooking.end_datetime,
              pickup_address: b.SelfDriveBooking.pickup_address,
              drop_address: b.SelfDriveBooking.drop_address,
              base_amount: b.SelfDriveBooking.base_amount,
              insure_amount: b.SelfDriveBooking.insure_amount,
              driver_amount: b.SelfDriveBooking.driver_amount,
              drop_charge: b.SelfDriveBooking.drop_charge,
              gst_amount: b.SelfDriveBooking.gst_amount,
              total_amount: b.SelfDriveBooking.total_amount,
            }
          : null,
        intercity: b.IntercityBooking ?? null,
      })),
      service: serviceBookings.map(shapeServiceBooking),
    });
  } catch (err) {
    console.error("Error fetching host bookings:", err);
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

exports.editBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    const { status, total_amount } = req.body;
    if (status) booking.status = status;
    if (total_amount !== undefined) booking.total_amount = total_amount;
    await booking.save();
    res.json({ message: "Booking updated", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    await booking.destroy();
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
