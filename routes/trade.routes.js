const express = require("express");
const router = express.Router();
const ctrl = require("../controller/trade.controller");
const { verifyToken, checkRole } = require("../middleware/authmiddleware");

// ─── Trade Car Creation ────────────────────────────────────────────────────────
/**
 * Step 0 — Create the Car + TradeListing skeleton
 * Body: { make_id, model_id, year, kms_driven, expected_price }
 * Returns: { car_id, listing_id, asking_price, next_steps[] }
 *
 * After this the client calls standard /car/* routes with the returned car_id:
 *   POST /car/addRC
 *   POST /car/addInsurance
 *   POST /car/addImage
 *   POST /car/addFastag      (optional)
 *   POST /car-features
 */
router.post(
  "/add-car",
  verifyToken,
  checkRole(["host", "admin"]),
  ctrl.addCarForTrade,
);

// ─── Listings ─────────────────────────────────────────────────────────────────

// Create a listing (legacy — also updates Car.kms_driven)
router.post("/listing", verifyToken, ctrl.createListing);

// All listings for the logged-in seller (with car details)
router.get("/listing/my", verifyToken, ctrl.getMyListings);

// Public feed — all active listings for buyers to browse
router.get("/listing/all", ctrl.getAllListings);

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
