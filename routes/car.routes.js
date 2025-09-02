// routes/car.routes.js
const express = require("express");
const router = express.Router();
const carController = require("../controller/car.controller");
const { verifyToken, checkRole } = require("../middleware/authmiddleware");
const multer = require("multer");

// ========= Multer setup =========
const storage = multer.memoryStorage(); // store in memory for S3
const upload = multer({ storage });

// ========= Routes =========
// Only "admin" and "host" roles can access these routes

router.post(
  "/addCar",
  verifyToken,
  checkRole(["admin", "host"]),
  carController.addCar
);

router.post(
  "/addRC",
  verifyToken,
  checkRole(["admin", "host"]),
  upload.fields([
    { name: "rc_image_front", maxCount: 1 },
    { name: "rc_image_back", maxCount: 1 },
  ]),
  carController.addRC
);

router.post(
  "/addInsurance",
  verifyToken,
  checkRole(["admin", "host"]),
  upload.single("insurance_image"),
  carController.addInsurance
);

router.post(
  "/addImage",
  verifyToken,
  checkRole(["admin", "host"]),
  upload.array("images", 10),
  carController.addImage
);

router.post(
  "/addFastTag",
  verifyToken,
  checkRole(["admin", "host"]),
  upload.single("fasttag_number"),
  carController.addFastTag
);

router.post(
  "/updateKMS",
  verifyToken,
  checkRole(["admin", "host"]),
  carController.updateKMS
);

router.delete(
  "/deleteCar/:car_id",
  verifyToken,
  checkRole(["admin", "host"]),
  carController.deleteCar
);

module.exports = router;
