const {
  TradeRequest,
  TradeListing,
  TradeOffer,
  TradeDeal,
  Car,
  CarPhoto,
  CarDocument,
  CarMake,
  CarModel,
} = require("../models");

// ─── helpers ──────────────────────────────────────────────────────────────────

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

const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

// ─── Car include helper (reused across queries) ───────────────────────────────

const carInclude = (withDocs = false) => ({
  model: Car,
  as: "car",
  attributes: ["id", "year", "kms_driven", "status", "make_id", "model_id"],
  include: [
    { model: CarPhoto, as: "photos", attributes: ["photo_url"] },
    { model: CarMake, as: "make", attributes: ["name"] },
    { model: CarModel, as: "model", attributes: ["name"] },
    ...(withDocs
      ? [
          {
            model: CarDocument,
            attributes: [
              "rc_number",
              "owner_name",
              "city_of_registration",
              "rc_valid_till",
              "rc_image_front",
              "rc_image_back",
              "insurance_company",
              "insurance_idv_value",
              "insurance_image",
              "insurance_valid_till",
            ],
          },
        ]
      : []),
  ],
});

// ─── createRequest ────────────────────────────────────────────────────────────

exports.createRequest = async (buyer_id, data) => {
  const safeData = pick(data, allowedRequestFields);
  return TradeRequest.create({ buyer_id, ...safeData });
};

// ─── createListing ────────────────────────────────────────────────────────────
/**
 * 1. Validate required fields
 * 2. Verify car belongs to seller
 * 3. Update Car.kms_driven if provided
 * 4. Create TradeListing (expected_price → asking_price, notes → description)
 */
exports.createListing = async (seller_id, data) => {
  const { car_id, kms_driven, expected_price, city, notes } = data;

  if (!car_id) throw new Error("car_id is required");
  if (!expected_price) throw new Error("expected_price is required");
  if (!city) throw new Error("city is required");

  const car = await Car.findOne({ where: { id: car_id, host_id: seller_id } });
  if (!car) throw new Error("Car not found or does not belong to you");

  if (kms_driven !== undefined && kms_driven !== null) {
    const kms = parseInt(kms_driven, 10);
    if (isNaN(kms) || kms < 0)
      throw new Error("kms_driven must be a non-negative number");
    await car.update({ kms_driven: kms });
  }

  return TradeListing.create({
    seller_id,
    car_id,
    asking_price: parseFloat(expected_price),
    city: city.trim(),
    description: notes ? notes.trim() : null,
    status: "active",
  });
};

// ─── getMyListings ────────────────────────────────────────────────────────────
/**
 * Returns two lists for the seller's "My Listings" screen:
 *
 *  listings     — all trade listings by this seller (with car + price + docs)
 *  unlistedCars — cars this seller owns that have NO active listing
 *
 * Frontend uses this to show:
 *   ▸ Listed tab:   listings with asking_price badge
 *   ▸ Unlisted tab: unlistedCars with "List for Sale" CTA
 */
exports.getMyListings = async (seller_id) => {
  // All listings by this seller (include docs for detail view)
  const listings = await TradeListing.findAll({
    where: { seller_id },
    include: [carInclude(true)],
    order: [["createdAt", "DESC"]],
  });

  // All cars owned by this seller
  const allCars = await Car.findAll({
    where: { host_id: seller_id },
    attributes: ["id", "year", "kms_driven", "status", "make_id", "model_id"],
    include: [
      { model: CarPhoto, as: "photos", attributes: ["photo_url"] },
      { model: CarMake, as: "make", attributes: ["name"] },
      { model: CarModel, as: "model", attributes: ["name"] },
    ],
  });

  // Cars with an active listing
  const listedCarIds = new Set(
    listings.filter((l) => l.status === "active").map((l) => String(l.car_id)),
  );

  const unlistedCars = allCars.filter((c) => !listedCarIds.has(String(c.id)));

  return { listings, unlistedCars };
};

// ─── getAllListings ───────────────────────────────────────────────────────────
/**
 * Public feed: all ACTIVE listings across all sellers.
 * Used by buyers to browse available cars.
 */
exports.getAllListings = async () => {
  return TradeListing.findAll({
    where: { status: "active" },
    include: [carInclude(false)],
    order: [["createdAt", "DESC"]],
  });
};

// ─── updateListing ────────────────────────────────────────────────────────────

exports.updateListing = async (seller_id, listing_id, data) => {
  const listing = await TradeListing.findOne({
    where: { id: listing_id, seller_id },
  });
  if (!listing) throw new Error("Listing not found or does not belong to you");

  return listing.update(
    pick(data, ["asking_price", "city", "description", "status"]),
  );
};

// ─── deleteListing ────────────────────────────────────────────────────────────

exports.deleteListing = async (seller_id, listing_id) => {
  const listing = await TradeListing.findOne({
    where: { id: listing_id, seller_id },
  });
  if (!listing) throw new Error("Listing not found or does not belong to you");
  await listing.destroy();
  return { message: "Listing deleted successfully" };
};

// ─── makeOffer ────────────────────────────────────────────────────────────────

exports.makeOffer = async (data) => TradeOffer.create(data);

// ─── acceptOffer ──────────────────────────────────────────────────────────────

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

  return TradeDeal.create({
    buyer_id: offer.request.buyer_id,
    seller_id: offer.listing.seller_id,
    request_id: offer.request_id,
    listing_id: offer.listing_id,
    final_price: offer.offer_price,
  });
};

// ─── getMyRequests ────────────────────────────────────────────────────────────

exports.getMyRequests = async (buyer_id) => {
  return TradeRequest.findAll({
    where: { buyer_id },
    order: [["createdAt", "DESC"]],
  });
};
