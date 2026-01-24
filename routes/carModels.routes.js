const express = require("express");
const router = express.Router();
const carModelController = require("../controller/carModel.controller");
const { verifyToken, checkRole } = require("../middleware/authmiddleware");

// PUBLIC
router.get("/", carModelController.getModelsByMake);

// ADMIN
router.post(
  "/",
  verifyToken,
  checkRole("admin"),
  carModelController.createCarModel,
);
router.delete(
  "/:id",
  verifyToken,
  checkRole("admin"),
  carModelController.deleteCarModel,
);

module.exports = router;
