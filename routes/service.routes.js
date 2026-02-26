const router = require("express").Router();
const controller = require("../controller/car-service.controller");
const { verifyToken } = require("../middleware/authmiddleware");
const multer = require("multer");

// ========= Multer setup =========
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/book", verifyToken, controller.createBooking);
router.get("/:id/checklist", controller.getChecklist);
router.patch("/checklist/:itemId", controller.updateChecklistItem);
router.post("/:id/complete", controller.completeBooking);
router.get("/", controller.getAllServicePlans);
router.post(
  "/addCar",
  verifyToken,
  upload.single("car_image"),
  controller.addCarForService,
);

module.exports = router;
