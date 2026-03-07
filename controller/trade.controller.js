const tradeService = require("../services/trade.service");

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
