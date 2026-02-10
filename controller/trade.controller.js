const tradeService = require("../services/trade.service");

exports.createRequest = async (req, res) => {
  try {
    const request = await tradeService.createRequest(req.user.id, req.body);
    res.json(request);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.createListing = async (req, res) => {
  try {
    const listing = await tradeService.createListing(req.user.id, req.body);
    res.json(listing);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.makeOffer = async (req, res) => {
  try {
    const offer = await tradeService.makeOffer(req.body);
    res.json(offer);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.acceptOffer = async (req, res) => {
  try {
    const deal = await tradeService.acceptOffer(req.params.offerId);
    res.json(deal);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
