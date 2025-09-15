const express = require("express");
const router = express.Router();
const carDetailsController = require("../controller/carDetails.controller");

router.post("/getCarDetails", carDetailsController.getCarDetails);

module.exports = router;
