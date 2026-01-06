const {
  Car,
  CarDocument,
  CarPhoto,
  CarLocation,
  Booking,
  CarStandards,
  User,
  CarFeatures,
} = require("../models");

const { Op, Sequelize } = require("sequelize");
const { uploadToS3 } = require("../utils/s3Upload");
// Add Car
exports.addCar = async (req, res) => {
  try {
    host_id = req.user.id;
    const { make, model, year, description } = req.body;

    const car = await Car.create({
      make,
      model,
      year,
      description,
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

exports.updateCar = async (req, res) => {
  try {
    const host_id = req.user.id;
    const { car_id, make, model, year, description } = req.body;

    // Find car by car_id and host_id (ensures owner is updating their own car)
    const car = await Car.findOne({ where: { id: car_id, host_id } });

    if (!car) {
      return res.status(404).json({ message: "Car not found or unauthorized" });
    }

    // Update only provided fields
    if (make !== undefined) car.make = make;
    if (model !== undefined) car.model = model;
    if (year !== undefined) car.year = year;
    if (description !== undefined) car.description = description;

    await car.save();

    res.status(200).json({
      message: "Car updated successfully",
      car_id: car.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating car",
      error: error.message,
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
      hand_type, // NEW
      registration_type, // NEW
    } = req.body; // Check if car_id is passed

    if (!car_id) {
      return res.status(400).json({ message: "car_id is required" });
    } // Check if both images are passed

    if (!req.files || !req.files.rc_image_front || !req.files.rc_image_back) {
      return res.status(400).json({ message: "Both RC images are required" });
    } // Upload both images to S3

    const rcFrontUrl = await uploadToS3(req.files.rc_image_front[0]);
    const rcBackUrl = await uploadToS3(req.files.rc_image_back[0]); // Find if document exists for this car

    let carDoc = await CarDocument.findOne({ where: { car_id } });

    if (!carDoc) {
      // Create new RC document with new fields
      carDoc = await CarDocument.create({
        car_id,
        rc_image_front: rcFrontUrl,
        rc_image_back: rcBackUrl,
        owner_name,
        rc_number,
        rc_valid_till,
        city_of_registration,
        hand_type, // NEW
        registration_type, // NEW
      });
    } else {
      // Update existing RC document with new fields
      carDoc.rc_image_front = rcFrontUrl;
      carDoc.rc_image_back = rcBackUrl;
      carDoc.owner_name = owner_name;
      carDoc.rc_number = rc_number;
      carDoc.rc_valid_till = rc_valid_till;
      carDoc.city_of_registration = city_of_registration;
      carDoc.hand_type = hand_type; // NEW
      carDoc.registration_type = registration_type; // NEW
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

exports.updateRC = async (req, res) => {
  try {
    const {
      car_id,
      owner_name,
      rc_number,
      rc_valid_till,
      city_of_registration,
    } = req.body || {}; // avoid destructure error

    if (!car_id) {
      return res.status(400).json({ message: "car_id is required" });
    }

    let carDoc = await CarDocument.findOne({ where: { car_id } });
    if (!carDoc) {
      return res
        .status(404)
        .json({ message: "RC document not found for this car" });
    }

    // Update images if provided
    if (req.files?.rc_image_front) {
      carDoc.rc_image_front = await uploadToS3(req.files.rc_image_front[0]);
    }
    if (req.files?.rc_image_back) {
      carDoc.rc_image_back = await uploadToS3(req.files.rc_image_back[0]);
    }

    // Update text fields if present
    if (owner_name) carDoc.owner_name = owner_name;
    if (rc_number) carDoc.rc_number = rc_number;
    if (rc_valid_till) carDoc.rc_valid_till = rc_valid_till;
    if (city_of_registration)
      carDoc.city_of_registration = city_of_registration;

    await carDoc.save();

    res.status(200).json({
      message: "RC details updated successfully",
      data: carDoc,
    });
  } catch (error) {
    console.error("Error updating RC:", error);
    res.status(500).json({
      message: "Error updating RC",
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
exports.updateInsurance = async (req, res) => {
  try {
    const host_id = req.user.id;
    const {
      car_id,
      insurance_company,
      insurance_idv_value,
      insurance_valid_till,
    } = req.body;

    if (!car_id) {
      return res.status(400).json({ message: "car_id is required" });
    }

    // Find car to ensure ownership
    const car = await Car.findOne({ where: { id: car_id, host_id } });
    if (!car) {
      return res.status(403).json({ message: "Unauthorized or car not found" });
    }

    // Find document
    const carDoc = await CarDocument.findOne({ where: { car_id } });
    if (!carDoc) {
      return res.status(404).json({ message: "Insurance document not found" });
    }

    // Update fields if provided
    if (insurance_company) carDoc.insurance_company = insurance_company;
    if (insurance_idv_value !== undefined) {
      const formattedIdv = parseFloat(insurance_idv_value).toFixed(2);
      if (!isNaN(formattedIdv)) carDoc.insurance_idv_value = formattedIdv;
    }
    if (insurance_valid_till)
      carDoc.insurance_valid_till = insurance_valid_till;

    // Handle image upload if provided
    if (req.files?.insurance_image) {
      carDoc.insurance_image = await uploadToS3(req.files.insurance_image[0]);
    }

    await carDoc.save();

    res.status(200).json({
      message: "Insurance details updated successfully",
      data: carDoc,
    });
  } catch (error) {
    console.error("Error updating insurance:", error);
    res.status(500).json({
      message: "Error updating insurance",
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

    if (!car_id) {
      return res.status(400).json({
        status: "error",
        message: "car_id is required",
      });
    }

    const now = new Date();

    // 🔍 1. Check for ACTIVE or FUTURE bookings
    const activeOrFutureBooking = await Booking.findOne({
      where: {
        car_id,
        status: {
          [Op.in]: ["initiated", "booked"],
        },
        end_datetime: {
          [Op.gte]: now,
        },
      },
    });

    if (activeOrFutureBooking) {
      return res.status(409).json({
        status: "blocked",
        message:
          "Car cannot be deleted because it has active or upcoming bookings",
      });
    }

    // 🔍 2. Check if ANY booking exists (past)
    const anyPastBooking = await Booking.findOne({
      where: {
        car_id,
      },
    });

    // 🟡 Past booking exists → Make car invisible
    if (anyPastBooking) {
      await Car.update({ is_visible: false }, { where: { id: car_id } });

      return res.status(200).json({
        status: "hidden",
        message:
          "Car has past bookings, so it has been made invisible instead of deleting",
      });
    }

    // ✅ 3. No bookings at all → FULL DELETE
    console.log("Deleting CarPhotos for car_id:", car_id);
    await CarPhoto.destroy({ where: { car_id } });

    console.log("Deleting CarDocuments for car_id:", car_id);
    await CarDocument.destroy({ where: { car_id } });

    console.log("Deleting CarFeatures for car_id:", car_id);
    await CarFeatures.destroy({ where: { car_id } });

    console.log("Deleting CarStandards for car_id:", car_id);
    await CarStandards.destroy({ where: { car_id } });

    console.log("Deleting CarLocation for car_id:", car_id);
    await CarLocation.destroy({ where: { car_id } });

    console.log("Deleting Car for id:", car_id);
    await Car.destroy({ where: { id: car_id } });

    console.log("All deletions done. Sending success response.");

    return res.status(200).json({
      status: "deleted",
      message: "Car deleted permanently",
    });
  } catch (error) {
    console.error("Delete car error:", error);
    return res.status(500).json({
      status: "error",
      message: "Error deleting car",
      error: error.message,
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
    // Step 1: Fetch all cars
    const cars = await Car.findAll({
      attributes: ["id", "make", "model", "year", "price_per_hour"],
      raw: true,
    });

    // Step 2: Collect all car IDs
    const carIds = cars.map((car) => car.id);

    // Step 3: Fetch photos for all cars (first photo per car)
    const photos = await CarPhoto.findAll({
      where: { car_id: carIds },
      attributes: ["car_id", "photo_url"],
      order: [["id", "ASC"]],
      raw: true,
    });

    // Step 4: Fetch documents for all cars
    const documents = await CarDocument.findAll({
      where: { car_id: carIds },
      attributes: ["car_id", "city_of_registration"],
      raw: true,
    });

    // Step 5: Combine data
    const formattedCars = cars.map((car) => {
      const photo = photos.find((p) => p.car_id === car.id);
      const doc = documents.find((d) => d.car_id === car.id);

      return {
        id: car.id,
        name: car.model,
        brand: car.make,
        year: car.year,
        price: parseFloat(car.price_per_hour) || 0,
        image: photo ? photo.photo_url : null,
        location: doc ? doc.city_of_registration : "Not specified",
      };
    });

    res.json(formattedCars);
  } catch (error) {
    console.error("Error fetching cars:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getCityOfRegistration = async (req, res) => {
  try {
    const { car_id } = req.body;

    if (!car_id) {
      return res
        .status(400)
        .json({ message: "car_id is required in the request body" });
    }

    // Find the CarDocument by car_id
    const carDocument = await CarDocument.findOne({
      where: { car_id },
      attributes: ["city_of_registration"],
    });

    if (!carDocument) {
      return res
        .status(404)
        .json({ message: "Car document not found for this car_id" });
    }

    // Respond with the city_of_registration as location
    return res
      .status(200)
      .json({ location: carDocument.city_of_registration || "Not specified" });
  } catch (error) {
    console.error("Error fetching city_of_registration:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
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

    if (pickup >= dropoff) {
      return res.status(400).json({
        message: "Dropoff time must be after pickup time",
      });
    }

    const cars = await Car.findAll({
      where: {
        // car must be generally available in this range
        available_from: { [Op.lte]: pickup },
        available_till: { [Op.gte]: dropoff },

        // 🔥 EXCLUDE cars that have ANY overlapping booking
        id: {
          [Op.notIn]: Sequelize.literal(`
            (
              SELECT DISTINCT car_id
              FROM Bookings
              WHERE status IN ('initiated', 'booked')
              AND (
                (start_datetime <= '${pickup.toISOString()}' AND end_datetime >= '${pickup.toISOString()}')
                OR
                (start_datetime <= '${dropoff.toISOString()}' AND end_datetime >= '${dropoff.toISOString()}')
                OR
                (start_datetime >= '${pickup.toISOString()}' AND end_datetime <= '${dropoff.toISOString()}')
              )
            )
          `),
        },
      },

      include: [
        {
          model: CarDocument,
          required: true,
          where: Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("city_of_registration")),
            city.toLowerCase()
          ),
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
          ],
        },
        {
          model: CarPhoto,
          as: "photos",
          required: false,
          attributes: ["photo_url"],
        },
      ],
    });

    const response = cars.map((car) => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price_per_hour: car.price_per_hour,
      available_from: car.available_from,
      available_till: car.available_till,
      documents: car.CarDocument,
      photos: car.photos?.map((p) => p.photo_url) || [],
    }));

    return res.status(200).json({ cars: response });
  } catch (error) {
    console.error("Search Cars Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get Cars by Host ID with details (no bookings)
exports.getCarsByHostId = async (req, res) => {
  try {
    const host_id = req.user?.id;

    if (!host_id) {
      return res.status(400).json({ message: "host_id is required" });
    }

    // Only fetch cars that are visible
    const cars = await Car.findAll({
      where: { host_id, is_visible: true }, // ✅ visibility filter
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
          as: "photos",
          attributes: ["photo_url"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!cars || cars.length === 0) {
      return res
        .status(404)
        .json({ message: "No visible cars found for this host" });
    }

    const formattedCars = cars.map((car) => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price_per_hour: parseFloat(car.price_per_hour),
      kms_driven: car.kms_driven,
      available_from: car.available_from,
      available_till: car.available_till,
      is_visible: car.is_visible, // include visibility in response
      documents: car.CarDocument
        ? {
            rc_image_front: car.CarDocument.rc_image_front,
            rc_image_back: car.CarDocument.rc_image_back,
            owner_name: car.CarDocument.owner_name,
            insurance_company: car.CarDocument.insurance_company,
            insurance_idv_value: car.CarDocument.insurance_idv_value,
            insurance_image: car.CarDocument.insurance_image,
            rc_number: car.CarDocument.rc_number,
            rc_valid_till: car.CarDocument.rc_valid_till,
            city_of_registration: car.CarDocument.city_of_registration,
            fastag_image: car.CarDocument.fastag_image,
            trip_start_balance: car.CarDocument.trip_start_balance,
            trip_end_balance: car.CarDocument.trip_end_balance,
          }
        : null,
      photos: car.photos?.map((p) => p.photo_url) || [],
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

exports.getAdminCars = async (req, res) => {
  try {
    console.log("🔍 Fetching admin cars with details...");
    const cars = await Car.findAll({
      include: [
        {
          model: CarDocument,
          attributes: [
            "rc_number",
            "owner_name",
            "city_of_registration",
            "registration_type",
          ],
        },
        {
          model: CarStandards,
          as: "standards",
          attributes: ["seats", "fuel", "mileage", "transmission"],
        },
        {
          model: Booking,
          required: false,
          attributes: ["status", "start_datetime", "end_datetime"],
          where: {
            status: "booked",
            start_datetime: { [Op.lte]: new Date() },
            end_datetime: { [Op.gte]: new Date() },
          },
        },
        {
          model: User,
          as: "host",
          attributes: ["first_name", "last_name"],
        },
      ],
    });

    const formattedCars = cars.map((car) => {
      const isBooked = car.Bookings && car.Bookings.length > 0;
      const status = isBooked ? "Rented" : "Available";

      const month = car.createdAt
        ? car.createdAt.toLocaleString("default", { month: "long" })
        : "";

      return {
        id: car.id,
        carNo: car.CarDocument?.rc_number || "",
        name: `${car.make || ""} ${car.model || ""}`.trim(),
        type: car.CarDocument?.registration_type || "",
        price: Number(car.price_per_hour) || 0,
        status,
        location: car.CarDocument?.city_of_registration || "",
        year: car.year || 0,
        month,
        fuelType: car.CarStandards?.fuel || car.CarDocument?.fuel || "",
        seatingCapacity: car.CarStandards?.seats || 0,
        hostedBy: car.CarDocument?.owner_name || car.host?.name || "",
        isVerified: car.status === "approved",
        ratings: car.ratings || 0,
      };
    });

    res.status(200).json({ cars: formattedCars });
  } catch (error) {
    console.error("❌ Error fetching admin cars:", error);
    res.status(500).json({
      message: "Error fetching admin cars",
      error: error.message,
    });
  }
};
exports.adminEditCar = async (req, res) => {
  const t = await Car.sequelize.transaction(); // transaction to ensure data consistency
  try {
    const { id } = req.params; // ✅ get car_id from params

    const {
      make,
      model,
      year,
      price_per_hour,
      kms_driven,
      available_from,
      available_till,
      // CarDocument fields
      owner_name,
      rc_number,
      rc_valid_till,
      city_of_registration,
      registration_type,
      insurance_company,
      insurance_idv_value,
      insurance_valid_till,
      // CarStandards fields
      seats,
      fuel,
      mileage,
      transmission,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Car ID (params) is required" });
    }

    // ✅ Step 1: Find the car
    const car = await Car.findByPk(id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // ✅ Step 2: Update main Car table
    await car.update(
      {
        make,
        model,
        year,
        price_per_hour,
        kms_driven,
        available_from,
        available_till,
      },
      { transaction: t }
    );

    // ✅ Step 3: Update or Create CarDocument
    let carDoc = await CarDocument.findOne({ where: { car_id: id } });
    if (carDoc) {
      await carDoc.update(
        {
          owner_name,
          rc_number,
          rc_valid_till,
          city_of_registration,
          registration_type,
          insurance_company,
          insurance_idv_value,
          insurance_valid_till,
        },
        { transaction: t }
      );
    } else {
      carDoc = await CarDocument.create(
        {
          car_id: id,
          owner_name,
          rc_number,
          rc_valid_till,
          city_of_registration,
          registration_type,
          insurance_company,
          insurance_idv_value,
          insurance_valid_till,
        },
        { transaction: t }
      );
    }

    // ✅ Step 4: Update or Create CarStandards
    let carStandard = await CarStandards.findOne({ where: { car_id: id } });
    if (carStandard) {
      await carStandard.update(
        { seats, fuel, mileage, transmission },
        { transaction: t }
      );
    } else {
      carStandard = await CarStandards.create(
        {
          car_id: id,
          seats,
          fuel,
          mileage,
          transmission,
        },
        { transaction: t }
      );
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Car details updated successfully by admin",
      data: { car, carDoc, carStandard },
    });
  } catch (error) {
    await t.rollback();
    console.error("Error in adminEditCar:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating car details by admin",
      error: error.message,
    });
  }
};
