const express = require("express");
const router = express.Router();

router.use("/users", require("./user.routes"));
router.use("/user-profile", require("./userProfile.routes"));
router.use("/cars", require("./car.routes"));
router.use("/bookings", require("./booking.routes"));
router.use("/car-features", require("./carFeatures.routes"));
router.use("/car-details", require("./carDetails.routes"));
router.use("/user-document", require("./userDocument.routes"));
router.use("/car-standards", require("./carStandard.routes"));
router.use("/self-drive-bookings", require("./selfDriveBooking.routes"));
router.use("/intercity-bookings", require("./intercityBooking.routes"));
router.use("car-makes", require("./carMake.routes"));
router.use("/car-models", require("./carModels.routes"));

module.exports = router;
