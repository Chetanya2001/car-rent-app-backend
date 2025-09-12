const {
  Car,
  CarDocument,
  CarPhoto,
  CarLocation,
  Booking,
} = require("../models");
const { Op } = require("sequelize");
const { uploadToS3 } = require("../utils/s3Upload");
// Add Car
exports.addCar = async (req, res) => {
  try {
    host_id = req.user.id;
    const { make, model, year } = req.body;

    const car = await Car.create({
      make,
      model,
      year,
      host_id,
    });

    res.status(200).json({ car_id: car.id });
  } catch (error) {
    res.status(500).json({
      message: "Error adding car",
      error: error.message,
      car_id: 0,
    });
  }
};

exports.addRC = async (req, res) => {
  try {
    const {
      car_id,
      owner_name,
      rc_number,
      rc_valid_till,
      city_of_registration,
    } = req.body;

    // Check if car_id is passed
    if (!car_id) {
      return res.status(400).json({ message: "car_id is required" });
    }

    // Check if both images are passed
    if (!req.files || !req.files.rc_image_front || !req.files.rc_image_back) {
      return res.status(400).json({ message: "Both RC images are required" });
    }

    // Upload both images to S3
    const rcFrontUrl = await uploadToS3(req.files.rc_image_front[0]);
    const rcBackUrl = await uploadToS3(req.files.rc_image_back[0]);

    // Find if document exists for this car
    let carDoc = await CarDocument.findOne({ where: { car_id } });

    if (!carDoc) {
      // Create new RC document
      carDoc = await CarDocument.create({
        car_id,
        rc_image_front: rcFrontUrl,
        rc_image_back: rcBackUrl,
        owner_name,
        rc_number,
        rc_valid_till,
        city_of_registration,
      });
    } else {
      // Update existing RC document
      carDoc.rc_image_front = rcFrontUrl;
      carDoc.rc_image_back = rcBackUrl;
      carDoc.owner_name = owner_name;
      carDoc.rc_number = rc_number;
      carDoc.rc_valid_till = rc_valid_till;
      carDoc.city_of_registration = city_of_registration;
      await carDoc.save();
    }

    res.status(200).json({
      message: "RC details uploaded successfully",
      data: carDoc,
    });
  } catch (error) {
    console.error("Error uploading RC:", error);
    res.status(500).json({
      message: "Error uploading RC",
      error: error.message,
    });
  }
};

// Upload Insurance
exports.addInsurance = async (req, res) => {
  try {
    const {
      car_id,
      insurance_company,
      insurance_idv_value,
      insurance_valid_till,
    } = req.body;

    // Check if required fields are provided
    if (!car_id) {
      return res.status(400).json({ message: "car_id is required" });
    }
    if (!insurance_company) {
      return res.status(400).json({ message: "insurance_company is required" });
    }
    if (insurance_idv_value === undefined || insurance_idv_value === null) {
      return res
        .status(400)
        .json({ message: "insurance_idv_value is required" });
    }
    if (!insurance_valid_till) {
      return res
        .status(400)
        .json({ message: "insurance_valid_till is required" });
    }

    // Check if insurance image is provided
    if (!req.files || !req.files.insurance_image) {
      return res.status(400).json({ message: "Insurance image is required" });
    }

    // Validate and format insurance_idv_value to DECIMAL(10, 2)
    const formattedIdv = parseFloat(insurance_idv_value).toFixed(2);
    if (isNaN(formattedIdv) || formattedIdv < 0) {
      return res.status(400).json({
        message: "insurance_idv_value must be a valid non-negative number",
      });
    }

    // Upload insurance image to S3
    const insuranceImageUrl = await uploadToS3(req.files.insurance_image[0]);

    // Find if document exists for this car
    let carDoc = await CarDocument.findOne({ where: { car_id } });

    if (!carDoc) {
      // Create new document with all insurance details
      carDoc = await CarDocument.create({
        car_id,
        insurance_image: insuranceImageUrl,
        insurance_company,
        insurance_idv_value: formattedIdv,
        insurance_valid_till,
      });
    } else {
      // Update existing document with all insurance details
      carDoc.insurance_image = insuranceImageUrl;
      carDoc.insurance_company = insurance_company;
      carDoc.insurance_idv_value = formattedIdv;
      carDoc.insurance_valid_till = insurance_valid_till;
      await carDoc.save();
    }

    res.status(200).json({
      message: "Insurance details uploaded successfully",
      data: carDoc,
    });
  } catch (error) {
    console.error("Error uploading insurance:", error);
    res.status(500).json({
      message: "Error uploading insurance details",
      error: error.message,
    });
  }
};

// Upload Car Images
// ...existing code...
exports.addImage = async (req, res) => {
  try {
    const { car_id } = req.body;
    const images = req.files;

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        message: "No valid images uploaded",
        error: "Expected an array of files",
        status: "error",
      });
    }

    if (images.length < 4) {
      return res.status(400).json({ error: "At least 4 images are required" });
    }

    // Upload each image to S3 and get the URL
    const carPhotos = await Promise.all(
      images.map(async (img) => {
        const s3Url = await uploadToS3(img);
        return {
          car_id,
          photo_url: s3Url, // <-- use photo_url to match your DB column
        };
      })
    );

    await CarPhoto.bulkCreate(carPhotos);

    res.status(200).json({ status: "success", images: carPhotos });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      message: "Error uploading car images",
      error: error.message,
      status: "error",
    });
  }
};
// Upload Fastag
exports.addFastag = async (req, res) => {
  try {
    const { car_id, trip_start_balance, trip_end_balance } = req.body;

    // ✅ Ensure car_id exists
    if (!car_id) {
      return res.status(400).json({ message: "car_id is required" });
    }

    // ✅ Ensure Fastag image is provided
    if (!req.files || !req.files.fastag_image) {
      return res.status(400).json({ message: "Fastag image is required" });
    }

    // ✅ Upload Fastag image to S3
    const fastagUrl = await uploadToS3(req.files.fastag_image[0]);

    // ✅ Check if document already exists
    let carDoc = await CarDocument.findOne({ where: { car_id } });

    if (!carDoc) {
      // Create new CarDocument with Fastag
      carDoc = await CarDocument.create({
        car_id,
        fastag_image: fastagUrl,
        trip_start_balance: trip_start_balance || null,
        trip_end_balance: trip_end_balance || null,
      });
    } else {
      // Update existing CarDocument
      carDoc.fastag_image = fastagUrl;
      if (trip_start_balance !== undefined)
        carDoc.trip_start_balance = trip_start_balance;
      if (trip_end_balance !== undefined)
        carDoc.trip_end_balance = trip_end_balance;

      await carDoc.save();
    }

    res.status(200).json({
      message: "Fastag uploaded successfully",
      data: carDoc,
    });
  } catch (error) {
    console.error("Error uploading Fastag:", error);
    res.status(500).json({
      message: "Error uploading Fastag",
      error: error.message,
    });
  }
};

// Update KMS Driven
exports.updateKMS = async (req, res) => {
  try {
    const { car_id, kms_driven } = req.body;

    await Car.update({ kms_driven }, { where: { id: car_id } });

    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(500).json({
      message: "Error updating KMS",
      error: error.message,
      status: "error",
    });
  }
};

// Delete Car
exports.deleteCar = async (req, res) => {
  try {
    const { car_id } = req.params;

    await CarPhoto.destroy({ where: { car_id } });
    await CarDocument.destroy({ where: { car_id } });
    await Car.destroy({ where: { id: car_id } });

    res.status(200).json({ status: "deleted" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting car",
      error: error.message,
      status: "error",
    });
  }
};

// ========== CREATE ==========
exports.createCarLocation = async (req, res) => {
  try {
    const { car_id, city, address, latitude, longitude } = req.body;

    const carLocation = await CarLocation.create({
      car_id,
      city,
      address,
      latitude,
      longitude,
    });

    res.status(201).json({ message: "Car location created", carLocation });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating car location", error: error.message });
  }
};

// ========== READ ALL ==========
exports.getAllCarLocations = async (req, res) => {
  try {
    const carLocations = await CarLocation.findAll();
    res.status(200).json(carLocations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching car locations", error: error.message });
  }
};

// ========== READ ONE ==========
exports.getCarLocationById = async (req, res) => {
  try {
    const { id } = req.params;

    const carLocation = await CarLocation.findByPk(id);
    if (!carLocation) {
      return res.status(404).json({ message: "Car location not found" });
    }

    res.status(200).json(carLocation);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching car location", error: error.message });
  }
};

// ========== UPDATE ==========
exports.updateCarLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { city, address, latitude, longitude } = req.body;

    const carLocation = await CarLocation.findByPk(id);
    if (!carLocation) {
      return res.status(404).json({ message: "Car location not found" });
    }

    await carLocation.update({ city, address, latitude, longitude });

    res.status(200).json({ message: "Car location updated", carLocation });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating car location", error: error.message });
  }
};

// ========== DELETE ==========
exports.deleteCarLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const carLocation = await CarLocation.findByPk(id);
    if (!carLocation) {
      return res.status(404).json({ message: "Car location not found" });
    }

    await carLocation.destroy();

    res.status(200).json({ message: "Car location deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting car location", error: error.message });
  }
};

exports.getCars = async (req, res) => {
  try {
    const cars = await Car.findAll({
      include: [
        {
          model: CarPhoto,
          attributes: ["photo_url"], // assuming CarPhoto has a `url` field
          limit: 1,
        },
      ],
    });

    const formattedCars = cars.map((car) => ({
      id: car.id,
      name: car.model,
      brand: car.make,
      year: car.year,
      price: parseFloat(car.price_per_hour),
      image: car.CarPhotos.length > 0 ? car.CarPhotos[0].photo_url : null,
    }));

    res.json(formattedCars);
  } catch (err) {
    console.error("Error fetching cars:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update Car Availability & Rent
exports.updateAvailability = async (req, res) => {
  try {
    const { car_id, price_per_hour, available_from, available_till } = req.body;

    if (!car_id) {
      return res.status(400).json({ message: "car_id is required" });
    }
    if (!price_per_hour || !available_from || !available_till) {
      return res.status(400).json({
        message:
          "price_per_hour, available_from, and available_till are required",
      });
    }

    const car = await Car.findByPk(car_id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    await car.update({
      price_per_hour,
      available_from,
      available_till,
    });

    res.status(200).json({
      success: true,
      message: "Car availability updated successfully",
      data: car,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({
      message: "Error updating car availability",
      error: error.message,
    });
  }
};
// Search Cars API
exports.searchCars = async (req, res) => {
  try {
    const { city, pickup_datetime, dropoff_datetime } = req.body;

    if (!city || !pickup_datetime || !dropoff_datetime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const pickup = new Date(pickup_datetime);
    const dropoff = new Date(dropoff_datetime);

    // Step 1: fetch cars with matching city + availability window
    const cars = await Car.findAll({
      where: {
        available_from: { [Op.lte]: pickup },
        available_till: { [Op.gte]: dropoff },
      },
      include: [
        {
          model: CarDocument,
          required: true,
          where: { city_of_registration: city },
          attributes: [
            "car_id",
            "rc_image_front",
            "rc_image_back",
            "owner_name",
            "insurance_company",
            "insurance_idv_value",
            "insurance_image",
            "rc_number",
            "rc_valid_till",
          ], // only needed fields
        },
        {
          model: CarPhoto,
          required: false, // may not have photos
          attributes: ["photo_url"], // only return URL
        },
        {
          model: Booking,
          required: false,
          attributes: ["id", "start_datetime", "end_datetime"], // only minimal booking info
          where: {
            [Op.or]: [
              {
                start_datetime: { [Op.lte]: pickup },
                end_datetime: { [Op.gte]: pickup },
              },
              {
                start_datetime: { [Op.lte]: dropoff },
                end_datetime: { [Op.gte]: dropoff },
              },
              {
                start_datetime: { [Op.gte]: pickup },
                end_datetime: { [Op.lte]: dropoff },
              },
            ],
          },
        },
      ],
      logging: console.log,
    });

    // Step 2: filter out cars that have conflicting bookings
    const availableCars = cars
      .filter((car) => !car.Bookings || car.Bookings.length === 0)
      .map((car) => ({
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price_per_hour: car.price_per_hour,
        available_from: car.available_from,
        available_till: car.available_till,
        documents: car.CarDocument, // rc & insurance info
        photos: car.CarPhotos.map((p) => p.photo_url), // only photo URLs
      }));

    res.json({ cars: availableCars });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
// Get Cars by Host ID with details (no bookings)
exports.getCarsByHostId = async (req, res) => {
  try {
    const host_id = req.user.id;

    if (!host_id) {
      return res.status(400).json({ message: "host_id is required" });
    }

    const cars = await Car.findAll({
      where: { host_id },
      include: [
        {
          model: CarDocument,
          attributes: [
            "car_id",
            "rc_image_front",
            "rc_image_back",
            "owner_name",
            "insurance_company",
            "insurance_idv_value",
            "insurance_image",
            "rc_number",
            "rc_valid_till",
            "city_of_registration",
            "fastag_image",
            "trip_start_balance",
            "trip_end_balance",
          ],
        },
        {
          model: CarPhoto,
          attributes: ["photo_url"],
        },
      ],
    });

    if (!cars || cars.length === 0) {
      return res.status(404).json({ message: "No cars found for this host" });
    }

    // format response
    const formattedCars = cars.map((car) => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price_per_hour: car.price_per_hour,
      kms_driven: car.kms_driven,
      available_from: car.available_from,
      available_till: car.available_till,
      documents: car.CarDocument || null,
      photos: car.CarPhotos?.map((p) => p.photo_url) || [],
    }));

    res.status(200).json({ cars: formattedCars });
  } catch (error) {
    console.error("Error fetching cars by host:", error);
    res.status(500).json({
      message: "Error fetching cars by host",
      error: error.message,
    });
  }
};
