const router = require("express").Router();
const ctrl = require("../controller/trade.controller");
const verifyToken = require("../middleware/authmiddleware");

// Buy requests
router.post("/request", verifyToken, ctrl.createRequest);
router.get("/request/mine", verifyToken, ctrl.getMyRequests);

// Sell listings
router.post("/listing", verifyToken, ctrl.createListing);
router.get("/listing/mine", verifyToken, ctrl.getMyListings);

// Offers & Deals
router.post("/offer", verifyToken, ctrl.makeOffer);
router.post("/offer/:offerId/accept", verifyToken, ctrl.acceptOffer);

module.exports = router;
