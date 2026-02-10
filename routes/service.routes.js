const router = require("express").Router();
const controller = require("../controller/car-service.controller");

router.post("/book", controller.createBooking);
router.get("/:id/checklist", controller.getChecklist);
router.patch("/checklist/:itemId", controller.updateChecklistItem);
router.post("/:id/complete", controller.completeBooking);

module.exports = router;
