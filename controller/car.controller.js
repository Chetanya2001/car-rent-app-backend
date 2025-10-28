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

const { Op } = require("sequelize");
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

    console.log("Deleting CarPhotos for car_id:", car_id);
    await CarPhoto.destroy({ where: { car_id } });

    console.log("Deleting CarDocuments for car_id:", car_id);
    await CarDocument.destroy({ where: { car_id } });

    console.log("Deleting CarFeatures for car_id:", car_id);
    await CarFeatures.destroy({ where: { car_id } });
    console.log("Deleted CarStandards for car_id:", car_id);
    await CarStandards.destroy({ where: { car_id: car_id } });

    console.log("Deleting Car for id:", car_id);
    await Car.destroy({ where: { id: car_id } });

    // Log before sending response
    console.log("All deletions done. Sending success response.");

    res.status(200).json({ status: "deleted" });
  } catch (error) {
    console.error("Delete car error:", error);
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
          ],
        },
        {
          model: CarPhoto,
          as: "photos", // must match your model association alias
          required: false,
          attributes: ["photo_url"],
        },
        {
          model: Booking,
          required: false,
          attributes: ["id", "start_datetime", "end_datetime"],
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
        documents: car.CarDocument, // correct if no alias
        photos: car.photos?.map((p) => p.photo_url) || [], // ✅ use alias here
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
    const host_id = req.user?.id;

    if (!host_id) {
      return res.status(400).json({ message: "host_id is required" });
    }

    // ✅ Proper include with aliases matching your model associations
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
          as: "photos", // ✅ alias must match model definition
          attributes: ["photo_url"],
        },
      ],
      order: [["createdAt", "DESC"]], // optional sorting
    });

    if (!cars || cars.length === 0) {
      return res.status(404).json({ message: "No cars found for this host" });
    }

    // ✅ Proper mapping with alias-safe fields
    const formattedCars = cars.map((car) => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price_per_hour: parseFloat(car.price_per_hour),
      kms_driven: car.kms_driven,
      available_from: car.available_from,
      available_till: car.available_till,
      documents: car.documents
        ? {
            rc_image_front: car.documents.rc_image_front,
            rc_image_back: car.documents.rc_image_back,
            owner_name: car.documents.owner_name,
            insurance_company: car.documents.insurance_company,
            insurance_idv_value: car.documents.insurance_idv_value,
            insurance_image: car.documents.insurance_image,
            rc_number: car.documents.rc_number,
            rc_valid_till: car.documents.rc_valid_till,
            city_of_registration: car.documents.city_of_registration,
            fastag_image: car.documents.fastag_image,
            trip_start_balance: car.documents.trip_start_balance,
            trip_end_balance: car.documents.trip_end_balance,
          }
        : null,
      photos: car.photos?.map((p) => p.photo_url) || [], // ✅ alias-safe photos
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
