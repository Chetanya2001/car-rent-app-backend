const express = require("express");
const router = express.Router();
const carDetailsController = require("../controller/carDetails.controller");
const { verifyToken, checkRole } = require("../middleware/authmiddleware");
const multer = require("multer");

// ========= Multer setup =========
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/getCarDetails", carDetailsController.getCarDetails);
router.post(
  "/updateCarDetails",
  verifyToken,
  checkRole("host"),
  upload.fields([{ name: "insurance_image", maxCount: 1 }]),
  carDetailsController.updateCarDetails
);

module.exports = router;
