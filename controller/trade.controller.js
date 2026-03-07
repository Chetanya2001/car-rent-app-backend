const tradeService = require("../services/trade.service");
const { Car, TradeListing } = require("../models");

// ─── Trade-specific Add Car ────────────────────────────────────────────────────

/**
 * POST /trade/add-car
 * Body: { make_id, model_id, year, kms_driven, expected_price }
 *
 * Creates a Car entry (no description, with kms_driven) and a TradeListing
 * with asking_price = expected_price.
 *
 * After this, the client should call the standard car APIs in sequence:
 *   1. POST /car/addRC          → upload RC front & back
 *   2. POST /car/addInsurance   → upload insurance image + details
 *   3. POST /car/addImage       → upload car photos (min 4)
 *   4. POST /car/addFastag      → upload fastag (optional)
 *   5. POST /car-features       → add car features
 *
 * All of those endpoints accept car_id in the body/params, so the car_id
 * returned here is the only thing the client needs to carry forward.
 */
exports.addCarForTrade = async (req, res) => {
  try {
    const host_id = req.user.id;
    const { make_id, model_id, year, kms_driven, expected_price } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!make_id) {
      return res
        .status(400)
        .json({ success: false, error: "make_id is required" });
    }
    if (!model_id) {
      return res
        .status(400)
        .json({ success: false, error: "model_id is required" });
    }
    if (!year) {
      return res
        .status(400)
        .json({ success: false, error: "year is required" });
    }
    if (kms_driven === undefined || kms_driven === null) {
      return res
        .status(400)
        .json({ success: false, error: "kms_driven is required" });
    }
    if (expected_price === undefined || expected_price === null) {
      return res
        .status(400)
        .json({ success: false, error: "expected_price is required" });
    }

    const parsedPrice = parseFloat(expected_price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        error: "expected_price must be a valid non-negative number",
      });
    }

    // ── Step 1: Create Car ───────────────────────────────────────────────────
    // No `description` field — trade listings don't need it on the Car itself.
    // kms_driven is stored directly on the Car record.
    const car = await Car.create({
      make_id,
      model_id,
      year,
      kms_driven,
      host_id,
    });

    // ── Step 2: Create TradeListing with asking_price ────────────────────────
    const listing = await TradeListing.create({
      car_id: car.id,
      seller_id: host_id,
      asking_price: parsedPrice.toFixed(2),
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message:
        "Car created for trade successfully. Proceed to upload documents and images.",
      data: {
        car_id: car.id,
        listing_id: listing.id,
        asking_price: listing.asking_price,
      },
    });
  } catch (error) {
    console.error("Error in addCarForTrade:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// ─── Listings ─────────────────────────────────────────────────────────────────

/**
 * POST /trade/listing
 * Body: { car_id, kms_driven, expected_price, city, notes?, fuel_type?, color?, owner?, photos? }
 */
exports.createListing = async (req, res) => {
  try {
    const listing = await tradeService.createListing(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Car listed for sale successfully",
      data: listing,
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

/**
 * GET /trade/listing/my
 * Returns { listings: [...], unlistedCars: [...] }
 * ▸ listings     → seller's trade listings with car + asking_price
 * ▸ unlistedCars → seller's cars that have no active listing
 */
exports.getMyListings = async (req, res) => {
  try {
    const data = await tradeService.getMyListings(req.user.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * GET /trade/listing/all
 * Public feed — all active listings (for buyers to browse)
 */
exports.getAllListings = async (req, res) => {
  try {
    const data = await tradeService.getAllListings();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * PATCH /trade/listing/:id
 */
exports.updateListing = async (req, res) => {
  try {
    const listing = await tradeService.updateListing(
      req.user.id,
      req.params.id,
      req.body,
    );
    res.json({ success: true, data: listing });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

/**
 * DELETE /trade/listing/:id
 */
exports.deleteListing = async (req, res) => {
  try {
    const result = await tradeService.deleteListing(req.user.id, req.params.id);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

// ─── Requests ─────────────────────────────────────────────────────────────────

exports.createRequest = async (req, res) => {
  try {
    const request = await tradeService.createRequest(req.user.id, req.body);
    res.status(201).json({ success: true, data: request });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await tradeService.getMyRequests(req.user.id);
    res.json({ success: true, data: requests });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// ─── Offers ───────────────────────────────────────────────────────────────────

exports.makeOffer = async (req, res) => {
  try {
    const offer = await tradeService.makeOffer(req.body);
    res.status(201).json({ success: true, data: offer });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

exports.acceptOffer = async (req, res) => {
  try {
    const deal = await tradeService.acceptOffer(req.params.offerId);
    res.json({ success: true, data: deal });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};
