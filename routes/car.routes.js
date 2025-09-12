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

router.put(
  "/updateCar",
  verifyToken,
  checkRole(["admin", "host"]),
  carController.updateCar
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

router.put(
  "/update-rc",
  upload.fields([
    { name: "rc_image_front", maxCount: 1 },
    { name: "rc_image_back", maxCount: 1 },
  ]),
  carController.updateRC
);

router.post(
  "/addInsurance",
  verifyToken,
  checkRole(["admin", "host"]),
  upload.fields([{ name: "insurance_image", maxCount: 1 }]),
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
  "/addFastag",
  verifyToken,
  checkRole(["admin", "host"]),
  upload.fields([{ name: "fastag_image", maxCount: 1 }]),
  carController.addFastag
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

router.post(
  "/car-locations",
  verifyToken,
  checkRole(["admin", "host"]),
  carController.createCarLocation
);

router.get(
  "/car-locations",
  verifyToken,
  checkRole(["admin", "host"]),
  carController.getAllCarLocations
);

router.get(
  "/car-locations/:id",
  verifyToken,
  checkRole(["admin", "host"]),
  carController.getCarLocationById
);

router.put(
  "/car-locations/:id",
  verifyToken,
  checkRole(["admin", "host"]),
  carController.updateCarLocation
);

router.delete(
  "/car-locations/:id",
  verifyToken,
  checkRole(["admin", "host"]),
  carController.deleteCarLocation
);

router.get("/", carController.getCars);

router.post("/more-details", carController.updateAvailability);

router.post("/search", carController.searchCars);

router.post("/my-host-cars", verifyToken, carController.getCarsByHostId);

module.exports = router;
