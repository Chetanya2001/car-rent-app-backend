const {
  TradeRequest,
  TradeListing,
  TradeOffer,
  TradeDeal,
} = require("../models");

// ── helpers ───────────────────────────────────────────────────────────────────
const allowedRequestFields = [
  "preferred_make",
  "preferred_model",
  "min_year",
  "max_year",
  "min_amount",
  "max_amount",
  "min_kms_driven",
  "max_kms_driven",
  "fuel_type",
  "body_type",
  "transmission",
  "color",
  "features",
  "seats",
  "owner",
  "availability",
  "city",
  "notes",
];

const allowedListingFields = [
  "car_id",
  "kms_driven",
  "expected_price",
  "fuel_type",
  "body_type",
  "transmission",
  "color",
  "features",
  "seats",
  "owner",
  "availability",
  "city",
  "notes",
  "photos",
];

const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

// ── service methods ───────────────────────────────────────────────────────────
exports.createRequest = async (buyer_id, data) => {
  const safeData = pick(data, allowedRequestFields);
  return TradeRequest.create({ buyer_id, ...safeData });
};

exports.createListing = async (seller_id, data) => {
  const safeData = pick(data, allowedListingFields);
  return TradeListing.create({ seller_id, ...safeData });
};

exports.makeOffer = async (data) => {
  return TradeOffer.create(data);
};

exports.acceptOffer = async (offerId) => {
  const offer = await TradeOffer.findByPk(offerId, {
    include: [
      { model: TradeRequest, as: "request" },
      { model: TradeListing, as: "listing" },
    ],
  });

  if (!offer) throw new Error("Offer not found");

  offer.status = "accepted";
  await offer.save();

  const deal = await TradeDeal.create({
    buyer_id: offer.request.buyer_id,
    seller_id: offer.listing.seller_id,
    request_id: offer.request_id,
    listing_id: offer.listing_id,
    final_price: offer.offer_price,
  });

  return deal;
};

exports.getMyRequests = async (buyer_id) => {
  return TradeRequest.findAll({
    where: { buyer_id },
    order: [["createdAt", "DESC"]],
  });
};

exports.getMyListings = async (seller_id) => {
  return TradeListing.findAll({
    where: { seller_id },
    order: [["createdAt", "DESC"]],
  });
};
