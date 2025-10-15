const express = require("express");
const router = express.Router();
const {
  SearchCars,
  ViewaCar,
  bookCar,
  getAllBookingsAdmin,
  getHostBookings,
  getGuestBookings,
} = require("../controller/booking.controller");
const { verifyToken } = require("../middleware/authmiddleware");

// Search cars
router.post("/search-cars", SearchCars);

// View a car
router.post("/view-car", ViewaCar);

// Book a car
router.post("/book-car", verifyToken, bookCar);

// Get bookings (Admin)
router.get("/admin/bookings", verifyToken, getAllBookingsAdmin);

// Get bookings for host (cars owned)
router.get("/host/bookings", verifyToken, getHostBookings);

// Get bookings for guest
router.get("/guest/bookings", verifyToken, getGuestBookings);

module.exports = router;
