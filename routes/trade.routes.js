const express = require("express");
const router = express.Router();
const ctrl = require("../controller/trade.controller");
const { verifyToken } = require("../middleware/authmiddleware");

// ─── Listings ─────────────────────────────────────────────────────────────────

// Create a new listing  →  also updates Car.kms_driven
router.post("/listing", verifyToken, ctrl.createListing);

// All listings for the logged-in seller (with car details)
router.get("/listing/my", verifyToken, ctrl.getMyListings);

// Update listing fields (asking_price, city, description, status)
router.patch("/listing/:id", verifyToken, ctrl.updateListing);

// Remove a listing
router.delete("/listing/:id", verifyToken, ctrl.deleteListing);

// ─── Requests ─────────────────────────────────────────────────────────────────

router.post("/request", verifyToken, ctrl.createRequest);
router.get("/request/my", verifyToken, ctrl.getMyRequests);

// ─── Offers ───────────────────────────────────────────────────────────────────

router.post("/offer", verifyToken, ctrl.makeOffer);
router.post("/offer/:offerId/accept", verifyToken, ctrl.acceptOffer);

module.exports = router;
