const router = require("express").Router();
const ctrl = require("../controller/trade.controller");

router.post("/request", ctrl.createRequest);
router.post("/listing", ctrl.createListing);
router.post("/offer", ctrl.makeOffer);
router.post("/offer/:offerId/accept", ctrl.acceptOffer);

module.exports = router;
