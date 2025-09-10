const { CarFeatures, Car } = require("../models"); // Adjust path based on your project structure
const { Op } = require("sequelize");

// Create a new CarFeatures entry
const createCarFeatures = async (req, res) => {
  try {
    const {
      car_id,
      airconditions,
      child_seat,
      gps,
      luggage,
      music,
      seat_belt,
      sleeping_bed,
      water,
      bluetooth,
      onboard_computer,
      audio_input,
      long_term_trips,
      car_kit,
      remote_central_locking,
      climate_control,
    } = req.body;

    // Validate car_id exists in Cars table
    const carExists = await Car.findByPk(car_id);
    if (!carExists) {
      return res.status(404).json({ error: "Car not found" });
    }

    // Check if car_id already has features
    const existingFeatures = await CarFeatures.findOne({ where: { car_id } });
    if (existingFeatures) {
      return res
        .status(400)
        .json({ error: "Car features already exist for this car_id" });
    }

    const carFeatures = await CarFeatures.create({
      car_id,
      airconditions,
      child_seat,
      gps,
      luggage,
      music,
      seat_belt,
      sleeping_bed,
      water,
      bluetooth,
      onboard_computer,
      audio_input,
      long_term_trips,
      car_kit,
      remote_central_locking,
      climate_control,
    });

    return res.status(201).json(carFeatures);
  } catch (error) {
    console.error("Error creating car features:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get all CarFeatures
const getAllCarFeatures = async (req, res) => {
  try {
    const carFeatures = await CarFeatures.findAll({
      include: [{ model: Car, attributes: ["id", "model", "brand"] }], // Include related Car data
    });
    return res.status(200).json(carFeatures);
  } catch (error) {
    console.error("Error fetching car features:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get CarFeatures by car_id
const getCarFeaturesById = async (req, res) => {
  try {
    const { car_id } = req.params;
    const carFeatures = await CarFeatures.findOne({
      where: { car_id },
      include: [{ model: Car, attributes: ["id", "model", "brand"] }],
    });

    if (!carFeatures) {
      return res.status(404).json({ error: "Car features not found" });
    }

    return res.status(200).json(carFeatures);
  } catch (error) {
    console.error("Error fetching car features:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update CarFeatures by car_id
const updateCarFeatures = async (req, res) => {
  try {
    const { car_id } = req.params;
    const {
      airconditions,
      child_seat,
      gps,
      luggage,
      music,
      seat_belt,
      sleeping_bed,
      water,
      bluetooth,
      onboard_computer,
      audio_input,
      long_term_trips,
      car_kit,
      remote_central_locking,
      climate_control,
    } = req.body;

    const carFeatures = await CarFeatures.findOne({ where: { car_id } });
    if (!carFeatures) {
      return res.status(404).json({ error: "Car features not found" });
    }

    await carFeatures.update({
      airconditions,
      child_seat,
      gps,
      luggage,
      music,
      seat_belt,
      sleeping_bed,
      water,
      bluetooth,
      onboard_computer,
      audio_input,
      long_term_trips,
      car_kit,
      remote_central_locking,
      climate_control,
    });

    return res.status(200).json(carFeatures);
  } catch (error) {
    console.error("Error updating car features:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete CarFeatures by car_id
const deleteCarFeatures = async (req, res) => {
  try {
    const { car_id } = req.params;
    const carFeatures = await CarFeatures.findOne({ where: { car_id } });

    if (!carFeatures) {
      return res.status(404).json({ error: "Car features not found" });
    }

    await carFeatures.destroy();
    return res
      .status(204)
      .json({ message: "Car features deleted successfully" });
  } catch (error) {
    console.error("Error deleting car features:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createCarFeatures,
  getAllCarFeatures,
  getCarFeaturesById,
  updateCarFeatures,
  deleteCarFeatures,
};
