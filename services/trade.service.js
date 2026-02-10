const {
  TradeRequest,
  TradeListing,
  TradeOffer,
  TradeDeal,
} = require("../models");

exports.createRequest = async (buyer_id, data) => {
  return TradeRequest.create({ buyer_id, ...data });
};

exports.createListing = async (seller_id, data) => {
  return TradeListing.create({ seller_id, ...data });
};

exports.makeOffer = async (data) => {
  return TradeOffer.create(data);
};

exports.acceptOffer = async (offerId) => {
  const offer = await TradeOffer.findByPk(offerId, {
    include: ["TradeRequest", "TradeListing"],
  });

  if (!offer) throw new Error("Offer not found");

  offer.status = "accepted";
  await offer.save();

  const deal = await TradeDeal.create({
    buyer_id: offer.TradeRequest.buyer_id,
    seller_id: offer.TradeListing.seller_id,
    request_id: offer.request_id,
    listing_id: offer.listing_id,
    final_price: offer.offer_price,
  });

  return deal;
};
