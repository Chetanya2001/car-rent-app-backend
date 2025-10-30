const express = require("express");
const router = express.Router();
const {
  SearchCars,
  ViewaCar,
  bookCar,
  getAllBookingsAdmin,
  getHostBookings,
  getGuestBookings,
  deleteBooking,
  updateBooking,
} = require("../controller/booking.controller");

const { verifyToken, checkRole } = require("../middleware/authmiddleware");

router.post("/search-cars", SearchCars);

router.post("/view-car", ViewaCar);

router.post("/book-car", verifyToken, bookCar);

router.get("/admin/bookings", verifyToken, getAllBookingsAdmin);

router.get("/host/bookings", verifyToken, getHostBookings);

router.get("/guest/bookings", verifyToken, getGuestBookings);

router.delete("/delete-booking/:id", verifyToken, deleteBooking);

router.put("/update-booking/:id", verifyToken, updateBooking);

module.exports = router;
