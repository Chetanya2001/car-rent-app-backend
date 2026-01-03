const express = require("express");
const router = express.Router();
const carFeaturesController = require("../controller/carFeatures.controller");
const { verifyToken, checkRole } = require("../middleware/authmiddleware");
router.post("/", carFeaturesController.createCarFeatures);
router.get("/", carFeaturesController.getAllCarFeatures);
router.get("/:car_id", verifyToken, carFeaturesController.getCarFeaturesById);
router.put(
  "/:car_id",
  verifyToken,
  checkRole(["admin", "host"]),
  carFeaturesController.updateCarFeatures
);
router.delete("/:car_id", verifyToken, carFeaturesController.deleteCarFeatures);

module.exports = router;
