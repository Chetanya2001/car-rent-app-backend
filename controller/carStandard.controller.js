const { CarStandards } = require("../models/carStandard.model"); // Adjust path as needed

// POST: Create or update CarStandards for a car_id
async function upsertCarStandards(req, res) {
  try {
    const { car_id, mileage, transmission, seats, luggage, fuel, range } =
      req.body;

    if (!car_id) {
      return res.status(400).json({ message: "car_id is required" });
    }

    // Check if record exists
    let carStandard = await CarStandards.findOne({ where: { car_id } });

    if (carStandard) {
      // Update existing
      await carStandard.update({
        mileage,
        transmission,
        seats,
        luggage,
        fuel,
        range,
      });
    } else {
      // Create new
      carStandard = await CarStandards.create({
        car_id,
        mileage,
        transmission,
        seats,
        luggage,
        fuel,
        range,
      });
    }

    return res.status(200).json(carStandard);
  } catch (error) {
    console.error("Error in upsertCarStandards:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET by car_id
async function getCarStandards(req, res) {
  try {
    const { car_id } = req.params;
    const carStandard = await CarStandards.findOne({ where: { car_id } });

    if (!carStandard) {
      return res.status(404).json({ message: "CarStandards not found" });
    }

    return res.status(200).json(carStandard);
  } catch (error) {
    console.error("Error in getCarStandards:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  upsertCarStandards,
  getCarStandards,
};
