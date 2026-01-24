const { CarModel, CarMake } = require("../models");

/**
 * CREATE CAR MODEL (ADMIN)
 */
exports.createCarModel = async (req, res) => {
  try {
    const { make_id, name, body_type } = req.body;

    if (!make_id || !name)
      return res.status(400).json({
        message: "make_id and model name are required",
      });

    const make = await CarMake.findByPk(make_id);
    if (!make) return res.status(404).json({ message: "Car make not found" });

    const exists = await CarModel.findOne({
      where: { make_id, name },
    });

    if (exists)
      return res
        .status(409)
        .json({ message: "Model already exists for this make" });

    const model = await CarModel.create({
      make_id,
      name,
      body_type,
    });

    res.status(201).json({
      message: "Car model created",
      data: model,
    });
  } catch (error) {
    console.error("createCarModel error:", error);
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
