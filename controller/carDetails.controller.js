const { Car, CarFeatures, CarPhoto } = require("../models");

// Get Car Details (with features + images)
exports.getCarDetails = async (req, res) => {
  try {
    const { car_id } = req.body;

    const car = await Car.findOne({
      where: { id: car_id },
      attributes: ["id", "make", "model", "year", "description"],
      include: [
        {
          model: CarFeatures,
          as: "features",
          attributes: [
            "airconditions",
            "child_seat",
            "gps",
            "luggage",
            "music",
            "seat_belt",
            "sleeping_bed",
            "water",
            "bluetooth",
            "onboard_computer",
            "audio_input",
            "long_term_trips",
            "car_kit",
            "remote_central_locking",
            "climate_control",
          ],
        },
        {
          model: CarPhoto,
          as: "photos",
          attributes: ["id", "photo_url"], // fetch all images
        },
      ],
    });

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching car details",
      error: error.message,
    });
  }
};
