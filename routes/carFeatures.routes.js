const express = require("express");
const router = express.Router();
const carFeaturesController = require("../controller/carFeatures.controller");

router.post("/", carFeaturesController.createCarFeatures);
router.get("/", carFeaturesController.getAllCarFeatures);
router.get("/:car_id", carFeaturesController.getCarFeaturesById);
router.put("/:car_id", carFeaturesController.updateCarFeatures);
router.delete("/:car_id", carFeaturesController.deleteCarFeatures);

module.exports = router;
