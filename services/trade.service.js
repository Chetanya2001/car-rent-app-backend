const {
  TradeRequest,
  TradeListing,
  TradeOffer,
  TradeDeal,
  CarMake,
  CarModel,
  Car,
  CarPhoto,
  CarDocument,
} = require("../models");

// ─── Field whitelists ─────────────────────────────────────────────────────────

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

// ─── createRequest ────────────────────────────────────────────────────────────

exports.createRequest = async (buyer_id, data) => {
  const safeData = pick(data, allowedRequestFields);
  return TradeRequest.create({ buyer_id, ...safeData });
};

// ─── createListing ────────────────────────────────────────────────────────────

exports.createListing = async (seller_id, data) => {
  const { car_id, kms_driven, expected_price, city, notes } = data;

  // ── 1. Validate required fields ────────────────────────────────────────────
  if (!car_id) throw new Error("car_id is required");
  if (!expected_price) throw new Error("expected_price is required");
  if (!city) throw new Error("city is required");

  // ── 2. Verify car ownership ────────────────────────────────────────────────
  const car = await Car.findOne({ where: { id: car_id, host_id: seller_id } });
  if (!car) throw new Error("Car not found or does not belong to you");

  // ── 3. Update Car.kms_driven ───────────────────────────────────────────────
  if (kms_driven !== undefined && kms_driven !== null) {
    const kms = parseInt(kms_driven, 10);
    if (isNaN(kms) || kms < 0) {
      throw new Error("kms_driven must be a non-negative number");
    }
    await car.update({ kms_driven: kms });
  }

  // ── 4. Create TradeListing ─────────────────────────────────────────────────
  //   TradeListing columns: asking_price | city | description | status
  //   We map: expected_price → asking_price, notes → description
  const listing = await TradeListing.create({
    seller_id,
    car_id,
    asking_price: parseFloat(expected_price),
    city: city.trim(),
    description: notes ? notes.trim() : null,
    status: "active",
  });

  return listing;
};

// ─── getMyListings ────────────────────────────────────────────────────────────
exports.getMyListings = async (seller_id) => {
  // 1. All listings for this seller
  const listings = await TradeListing.findAll({
    where: { seller_id },
    include: [
      {
        model: Car,
        as: "car",
        attributes: ["id", "year", "kms_driven", "status"],
        include: [
          { model: CarMake, as: "make", attributes: ["name"] },
          {
            model: CarModel,
            as: "model",
            attributes: [["model_name", "name"]],
          },
          { model: CarPhoto, as: "photos", attributes: ["photo_url"] },
          {
            model: CarDocument,
            as: "CarDocument",
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
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  // 2. IDs of cars that already have a listing
  const listedCarIds = new Set(listings.map((l) => l.car_id));

  // 3. All cars owned by this seller
  const allCars = await Car.findAll({
    where: { host_id: seller_id },
    attributes: ["id", "year", "kms_driven", "status"],
    include: [
      { model: CarMake, as: "make", attributes: ["name"] },
      { model: CarModel, as: "model", attributes: [["model_name"]] },
      { model: CarPhoto, as: "photos", attributes: ["photo_url"] },
    ],
  });

  // 4. Cars with no active listing
  const unlistedCars = allCars.filter((c) => !listedCarIds.has(c.id));

  return { listings, unlistedCars };
};
// ─── updateListing ────────────────────────────────────────────────────────────

exports.updateListing = async (seller_id, listing_id, data) => {
  const listing = await TradeListing.findOne({
    where: { id: listing_id, seller_id },
  });
  if (!listing) throw new Error("Listing not found or does not belong to you");

  const allowed = ["asking_price", "city", "description", "status"];
  const updates = pick(data, allowed);
  return listing.update(updates);
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

exports.makeOffer = async (data) => {
  return TradeOffer.create(data);
};

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

  const deal = await TradeDeal.create({
    buyer_id: offer.request.buyer_id,
    seller_id: offer.listing.seller_id,
    request_id: offer.request_id,
    listing_id: offer.listing_id,
    final_price: offer.offer_price,
  });

  return deal;
};

// ─── getMyRequests ────────────────────────────────────────────────────────────

exports.getMyRequests = async (buyer_id) => {
  return TradeRequest.findAll({
    where: { buyer_id },
    order: [["createdAt", "DESC"]],
  });
};
