const tradeService = require("../services/trade.service");

// ─── Listings ─────────────────────────────────────────────────────────────────

/**
 * POST /trade/listing
 *
 * Expected body from SellCarScreen:
 * {
 *   car_id        : string | number   (required)
 *   expected_price: number            (required) → stored as asking_price
 *   city          : string            (required)
 *   kms_driven    : number            (optional) → also updates Car.kms_driven
 *   notes         : string            (optional) → stored as description
 *   fuel_type     : string            (optional, informational)
 *   color         : string            (optional, informational)
 *   owner         : string            (optional, informational)
 *   photos        : string[]          (optional, informational)
 * }
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
 * All listings by the authenticated seller, with car details
 */
exports.getMyListings = async (req, res) => {
  try {
    const listings = await tradeService.getMyListings(req.user.id);
    res.json({ success: true, data: listings });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * PATCH /trade/listing/:id
 * Update asking_price, city, description, or status
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

/**
 * POST /trade/request
 */
exports.createRequest = async (req, res) => {
  try {
    const request = await tradeService.createRequest(req.user.id, req.body);
    res.status(201).json({ success: true, data: request });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

/**
 * GET /trade/request/my
 */
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await tradeService.getMyRequests(req.user.id);
    res.json({ success: true, data: requests });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// ─── Offers ───────────────────────────────────────────────────────────────────

/**
 * POST /trade/offer
 */
exports.makeOffer = async (req, res) => {
  try {
    const offer = await tradeService.makeOffer(req.body);
    res.status(201).json({ success: true, data: offer });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

/**
 * POST /trade/offer/:offerId/accept
 */
exports.acceptOffer = async (req, res) => {
  try {
    const deal = await tradeService.acceptOffer(req.params.offerId);
    res.json({ success: true, data: deal });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};
