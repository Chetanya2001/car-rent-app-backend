const express = require("express");
const router = express.Router();
const {
  getAllBookingsAdmin,
  getHostBookings,
  getGuestBookings,
  deleteBooking,
  editBooking,
} = require("../controller/booking.controller");

const { verifyToken, checkRole } = require("../middleware/authmiddleware");

router.get("/admin/bookings", verifyToken, getAllBookingsAdmin);

router.get("/host/bookings", verifyToken, getHostBookings);

router.get("/guest/bookings", verifyToken, getGuestBookings);

router.delete("/delete-booking/:id", verifyToken, deleteBooking);

router.put("/update-booking/:id", verifyToken, editBooking);

module.exports = router;
