const { CarMake } = require("../models");

/**
 * CREATE CAR MAKE (ADMIN)
 */
exports.createCarMake = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name)
      return res.status(400).json({ message: "Make name is required" });

    const exists = await CarMake.findOne({ where: { name } });
    if (exists)
      return res.status(409).json({ message: "Car make already exists" });

    const make = await CarMake.create({ name });

    res.status(201).json({
      message: "Car make created",
      data: make,
    });
  } catch (error) {
    console.error("createCarMake error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ALL MAKES (PUBLIC)
 */
exports.getAllCarMakes = async (req, res) => {
  try {
    const makes = await CarMake.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });

    res.json({ data: makes });
  } catch (error) {
    console.error("getAllCarMakes error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE MAKE (ADMIN)
 */
exports.deleteCarMake = async (req, res) => {
  try {
    const { id } = req.params;

    const make = await CarMake.findByPk(id);
    if (!make) return res.status(404).json({ message: "Car make not found" });

    await make.destroy();

    res.json({ message: "Car make deleted" });
  } catch (error) {
    console.error("deleteCarMake error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
