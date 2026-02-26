const {
  Car,
  CarDocument,
  CarMake,
  CarModel,
  CarPhoto,
  CarLocation,
  ServiceBooking,
  ChecklistItem,
  ServicePlan,
  ChecklistTemplate,
} = require("../models");
const bookingService = require("../services/car-service.service");
const { uploadToS3 } = require("../utils/s3Upload");

/**
 * GET /service/cars
 * Returns all cars belonging to the logged-in user for service selection.
 * Includes both rental cars and any cars added specifically for service.
 */
exports.getUserCarsForService = async (req, res) => {
  try {
    const user_id = req.user.id;

    const cars = await Car.findAll({
      where: {
        host_id: user_id,
        is_visible: true,
      },
      attributes: ["id", "year", "make_id", "model_id", "status", "car_mode"],
      include: [
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
        {
          model: CarDocument,
          attributes: [
            "rc_number",
            "owner_name",
            "registration_type",
            "hand_type",
            "rc_valid_till",
          ],
          required: false,
        },
        {
          model: CarPhoto,
          as: "photos",
          attributes: ["photo_url"],
          required: false,
          separate: true,
          order: [["id", "ASC"]],
          limit: 1,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formatted = cars.map((car) => ({
      car_id: car.id,
      make: car.make?.name || null,
      model: car.model?.name || null,
      year: car.year,
      car_mode: car.car_mode,
      status: car.status,
      rc_number: car.CarDocument?.rc_number || null,
      owner_name: car.CarDocument?.owner_name || null,
      registration_type: car.CarDocument?.registration_type || null,
      hand_type: car.CarDocument?.hand_type || null,
      rc_valid_till: car.CarDocument?.rc_valid_till || null,
      thumbnail: car.photos?.[0]?.photo_url || null,
    }));

    return res.status(200).json({ cars: formatted });
  } catch (error) {
    console.error("Error fetching user cars for service:", error);
    return res.status(500).json({
      message: "Error fetching cars",
      error: error.message,
    });
  }
};

/**
 * POST /service/cars/add
 * Adds a lightweight car for service purposes.
 * Reuses the same Car + CarDocument models — no new tables needed.
 * Only minimal fields required: make_id, model_id, year
 * Optionally stores rc_number, owner_name, registration_type in CarDocument.
 */
exports.addCarForService = async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      make_id,
      model_id,
      year,
      rc_number,
      owner_name,
      registration_type,
      hand_type,
      // Location fields
      address,
      city,
      latitude,
      longitude,
    } = req.body;

    // ── 1. Validate required fields ───────────────────────────────────────
    if (!make_id || !model_id || !year) {
      return res.status(400).json({
        message: "make_id, model_id, and year are required",
      });
    }

    if (!req.file && !req.files?.car_image) {
      return res.status(400).json({
        message: "car_image is required",
      });
    }

    // ── 2. Create Car record ──────────────────────────────────────────────
    const car = await Car.create({
      make_id,
      model_id,
      year,
      host_id: user_id,
      status: "active",
      is_visible: true,
    });

    // ── 3. Upload image to S3 → CarPhoto ──────────────────────────────────
    const imageFile = req.file || req.files?.car_image?.[0];
    const photoUrl = await uploadToS3(imageFile);

    await CarPhoto.create({
      car_id: car.id,
      photo_url: photoUrl,
    });

    // ── 4. CarDocument (RC + owner details) ───────────────────────────────
    if (rc_number || owner_name || registration_type || hand_type) {
      await CarDocument.create({
        car_id: car.id,
        rc_number: rc_number || null,
        owner_name: owner_name || null,
        registration_type: registration_type || "Private",
        hand_type: hand_type || "First",
      });
    }

    // ── 5. CarLocation ────────────────────────────────────────────────────
    if (city || address || latitude || longitude) {
      await CarLocation.create({
        car_id: car.id,
        address: address || null,
        city: city || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });
    }

    return res.status(201).json({
      message: "Car added successfully",
      car_id: car.id,
      thumbnail: photoUrl,
    });
  } catch (error) {
    console.error("Error adding car for service:", error);
    return res.status(500).json({
      message: "Error adding car",
      error: error.message,
    });
  }
};

/**
 * POST /service/bookings
 * Creates a service booking for a car owned by the logged-in user.
 */
exports.createBooking = async (req, res) => {
  try {
    console.log("==== CREATE BOOKING HIT ====");

    const { car_id, plan_id, scheduled_at, notes } = req.body;
    const user_id = req.user?.id;

    console.log("Request Body:", req.body);
    console.log("Authenticated User:", req.user);
    console.log("Extracted Values:", {
      car_id,
      plan_id,
      scheduled_at,
      user_id,
    });

    if (!car_id || !plan_id || !scheduled_at) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        message: "car_id, plan_id, and scheduled_at are required",
      });
    }

    // Verify the car belongs to this user
    const car = await Car.findOne({
      where: { id: car_id, host_id: user_id, is_visible: true },
    });

    console.log("Car lookup result:", car);

    if (!car) {
      console.log("❌ Car not found or not owned by user");
      return res.status(404).json({
        message: "Car not found or does not belong to you",
      });
    }

    // Verify the plan exists
    const plan = await ServicePlan.findOne({
      where: { id: plan_id, is_active: true },
    });

    console.log("Plan lookup result:", plan);

    if (!plan) {
      console.log("❌ Plan not found or inactive");
      return res.status(404).json({
        message: "Service plan not found or inactive",
      });
    }

    const booking = await bookingService.createBooking({
      car_id,
      user_id,
      plan_id,
      scheduled_at,
      notes: notes || null,
    });

    console.log("✅ Booking created:", booking);

    return res.status(201).json({
      message: "Service booking created successfully",
      booking,
    });
  } catch (err) {
    console.error("🔥 ERROR creating service booking:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * GET /service/bookings
 * Returns all service bookings for the logged-in user.
 */
exports.getUserBookings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const bookings = await ServiceBooking.findAll({
      where: { user_id },
      include: [
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
          attributes: ["name", "code", "price", "duration_minutes"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formatted = bookings.map((booking) => ({
      booking_id: booking.id,
      status: booking.status,
      scheduled_at: booking.scheduled_at,
      completed_at: booking.completed_at,
      total_price: booking.total_price,
      notes: booking.notes,
      car: {
        car_id: booking.Car?.id || null,
        make: booking.Car?.make?.name || null,
        model: booking.Car?.model?.name || null,
        year: booking.Car?.year || null,
        thumbnail: booking.Car?.photos?.[0]?.photo_url || null,
      },
      plan: {
        name: booking.ServicePlan?.name || null,
        code: booking.ServicePlan?.code || null,
        price: booking.ServicePlan?.price || null,
        duration_minutes: booking.ServicePlan?.duration_minutes || null,
      },
    }));

    return res.status(200).json({ bookings: formatted });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return res.status(500).json({
      message: "Error fetching bookings",
      error: error.message,
    });
  }
};

/**
 * GET /service/bookings/:id
 * Returns a single service booking with full details + checklist.
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const booking = await ServiceBooking.findOne({
      where: { id, user_id },
      include: [
        {
          model: Car,
          attributes: ["id", "year"],
          include: [
            { model: CarMake, as: "make", attributes: ["name"] },
            { model: CarModel, as: "model", attributes: ["name"] },
            {
              model: CarDocument,
              attributes: ["rc_number", "owner_name", "registration_type"],
              required: false,
            },
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
          attributes: [
            "name",
            "code",
            "price",
            "duration_minutes",
            "description",
          ],
        },
        {
          model: ChecklistItem,
          as: "checklist",
          attributes: ["id", "title", "status", "remarks", "completed_at"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({
      booking_id: booking.id,
      status: booking.status,
      scheduled_at: booking.scheduled_at,
      completed_at: booking.completed_at,
      total_price: booking.total_price,
      notes: booking.notes,
      car: {
        car_id: booking.Car?.id || null,
        make: booking.Car?.make?.name || null,
        model: booking.Car?.model?.name || null,
        year: booking.Car?.year || null,
        rc_number: booking.Car?.CarDocument?.rc_number || null,
        owner_name: booking.Car?.CarDocument?.owner_name || null,
        registration_type: booking.Car?.CarDocument?.registration_type || null,
        thumbnail: booking.Car?.photos?.[0]?.photo_url || null,
      },
      plan: {
        name: booking.ServicePlan?.name || null,
        code: booking.ServicePlan?.code || null,
        price: booking.ServicePlan?.price || null,
        duration_minutes: booking.ServicePlan?.duration_minutes || null,
        description: booking.ServicePlan?.description || null,
      },
      checklist: booking.checklist || [],
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({
      message: "Error fetching booking",
      error: error.message,
    });
  }
};

/**
 * GET /service/bookings/:id/checklist
 * Returns checklist items for a specific service booking.
 */
exports.getChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Verify booking belongs to user
    const booking = await ServiceBooking.findOne({
      where: { id, user_id },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const items = await ChecklistItem.findAll({
      where: { booking_id: id },
      order: [["id", "ASC"]],
    });

    return res.status(200).json({ checklist: items });
  } catch (error) {
    console.error("Error fetching checklist:", error);
    return res.status(500).json({
      message: "Error fetching checklist",
      error: error.message,
    });
  }
};

/**
 * PATCH /service/bookings/:id/checklist/:itemId
 * Updates a single checklist item (mechanic marks it done/failed/skipped).
 */
exports.updateChecklistItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status, remarks } = req.body;

    const validStatuses = ["pending", "completed", "failed", "skipped"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const item = await ChecklistItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ message: "Checklist item not found" });
    }

    item.status = status;
    item.remarks = remarks || null;
    item.completed_at = new Date();

    await item.save();

    return res.status(200).json({
      message: "Checklist item updated",
      item,
    });
  } catch (error) {
    console.error("Error updating checklist item:", error);
    return res.status(500).json({
      message: "Error updating checklist item",
      error: error.message,
    });
  }
};

/**
 * PATCH /service/bookings/:id/complete
 * Marks a service booking as completed.
 */
exports.completeBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await ServiceBooking.findByPk(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "completed") {
      return res.status(400).json({ message: "Booking is already completed" });
    }

    if (booking.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Cannot complete a cancelled booking" });
    }

    booking.status = "completed";
    booking.completed_at = new Date();
    await booking.save();

    return res.status(200).json({
      message: "Service booking marked as completed",
      booking,
    });
  } catch (error) {
    console.error("Error completing booking:", error);
    return res.status(500).json({
      message: "Error completing booking",
      error: error.message,
    });
  }
};

/**
 * PATCH /service/bookings/:id/cancel
 * Cancels a service booking (only if pending or scheduled).
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const booking = await ServiceBooking.findOne({
      where: { id, user_id },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const cancellableStatuses = ["pending", "scheduled"];
    if (!cancellableStatuses.includes(booking.status)) {
      return res.status(400).json({
        message: `Cannot cancel a booking with status: ${booking.status}`,
      });
    }

    booking.status = "cancelled";
    await booking.save();

    return res.status(200).json({
      message: "Service booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return res.status(500).json({
      message: "Error cancelling booking",
      error: error.message,
    });
  }
};

exports.getAllServicePlans = async (req, res) => {
  try {
    const servicePlans = await ServicePlan.findAll({
      where: {
        is_active: true, // optional: only active plans
      },
      include: [
        {
          model: ChecklistTemplate,
          as: "templates", // must match association
        },
      ],
      order: [["createdAt", "DESC"]], // optional
    });

    return res.status(200).json({
      success: true,
      message: "Service plans fetched successfully",
      data: servicePlans,
    });
  } catch (error) {
    console.error("Get Service Plans Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch service plans",
      error: error.message,
    });
  }
};
