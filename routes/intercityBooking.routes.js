const router = require("express").Router();
const controller = require("../controller/intercityBooking.controller");
const { verifyToken } = require("../middleware/authmiddleware");

router.post("/book", verifyToken, controller.bookIntercity);
module.exports = router;
