const express = require("express");
const router = express.Router();

router.use("/users", require("./user.routes"));
router.use("/user-profile", require("./userProfile.routes"));
router.use("/cars", require("./car.routes"));
module.exports = router;
