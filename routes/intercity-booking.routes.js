const express = require("express");
const router = express.Router();

const {
  searchIntercityCars,
  bookIntercityCar,
  getGuestIntercityBookings,
  getAllIntercityBookingsAdmin,
  updateIntercityBookingStatus,
} = require("../controller/intercity-booking.controller");

const { verifyToken } = require("../middleware/authmiddleware");

// ================= Intercity =================

// Search intercity cars
router.post("/intercity/search-cars", searchIntercityCars);

// Book intercity car
router.post("/intercity/book-car", verifyToken, bookIntercityCar);

// Guest: my intercity bookings
router.get("/intercity/guest/bookings", verifyToken, getGuestIntercityBookings);

// Admin: all intercity bookings
router.get(
  "/intercity/admin/bookings",
  verifyToken,
  getAllIntercityBookingsAdmin
);

// Admin: update booking status
router.put(
  "/intercity/update-booking/:id",
  verifyToken,
  updateIntercityBookingStatus
);

module.exports = router;
