const { CarModel, CarMake } = require("../models");

/**
 * CREATE CAR MODEL (ADMIN)
 */
// In your carModel.controller.js
exports.getModelsByMake = async (req, res) => {
  try {
    // We use req.query because the frontend is sending ?make_id=...
    const { make_id } = req.query;

    if (!make_id) {
      return res.status(400).json({ message: "make_id is required" });
    }

    const models = await CarModel.findAll({
      where: { make_id: make_id },
    });

    res.status(200).json(models);
  } catch (error) {
    console.error("getModelsByMake error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
/**
 * GET MODELS BY MAKE (PUBLIC)
 */
exports.getModelsByMake = async (req, res) => {
  try {
    const { make_id } = req.query;

    if (!make_id)
      return res.status(400).json({ message: "make_id is required" });

    const models = await CarModel.findAll({
      where: { make_id },
      attributes: ["id", "name", "body_type"],
      order: [["name", "ASC"]],
    });

    res.json({ data: models });
  } catch (error) {
    console.error("getModelsByMake error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE MODEL (ADMIN)
 */
exports.deleteCarModel = async (req, res) => {
  try {
    const { id } = req.params;

    const model = await CarModel.findByPk(id);
    if (!model) return res.status(404).json({ message: "Car model not found" });

    await model.destroy();

    res.json({ message: "Car model deleted" });
  } catch (error) {
    console.error("deleteCarModel error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
