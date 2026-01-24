const express = require("express");
const router = express.Router();
const carMakeController = require("../controller/carMake.controller");
const { verifyToken, checkRole } = require("../middleware/authmiddleware");

// PUBLIC
router.get("/", carMakeController.getAllCarMakes);

// ADMIN
router.post(
  "/",
  verifyToken,
  checkRole("admin"),
  carMakeController.createCarMake,
);
router.delete("/:id", carMakeController.deleteCarMake);

module.exports = router;
