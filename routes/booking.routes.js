const express = require("express");
const router = express.Router();
const {
  SearchCars,
  ViewaCar,
  bookCar,
} = require("../controller/booking.controller");
const { verifyToken } = require("../middleware/authmiddleware");

// Search cars
router.post("/search-cars", SearchCars);

// View a car
router.post("/view-car", ViewaCar);

// Book a car
router.post("/book-car", verifyToken, bookCar);

module.exports = router;
