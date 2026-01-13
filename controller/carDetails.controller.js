const { Car, CarFeatures, CarPhoto, CarDocument } = require("../models");
const { uploadToS3 } = require("../utils/s3Upload");

// Get Car Details (with pricing, insurance, features + images)
exports.getCarDetails = async (req, res) => {
  try {
    const { car_id } = req.body;

    if (!car_id) {
      return res.status(400).json({ message: "car_id is required" });
    }

    const car = await Car.findOne({
      where: { id: car_id },
      attributes: [
        "id",
        "make",
        "model",
        "year",
        "description",
        "host_id",
        "price_per_hour",
        "available_from",
        "price_per_km",
        "available_till",
        "kms_driven",
      ],
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
          attributes: ["id", "photo_url"],
        },
        {
          model: CarDocument,
          required: false,
          attributes: [
            "insurance_company",
            "insurance_idv_value",
            "insurance_valid_till",
            "insurance_image",
          ],
        },
      ],
    });

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Structured clean response
    const response = {
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      description: car.description || "",
      host_id: car.host_id,
      price_per_hour: car.price_per_hour
        ? parseFloat(car.price_per_hour)
        : null,
      price_per_km: car.price_per_km ? parseFloat(car.price_per_km) : null,
      available_from: car.available_from,
      available_till: car.available_till,
      kms_driven: car.kms_driven || 0,

      features: car.features
        ? {
            airconditions: car.features.airconditions,
            child_seat: car.features.child_seat,
            gps: car.features.gps,
            luggage: car.features.luggage,
            music: car.features.music,
            seat_belt: car.features.seat_belt,
            sleeping_bed: car.features.sleeping_bed,
            water: car.features.water,
            bluetooth: car.features.bluetooth,
            onboard_computer: car.features.onboard_computer,
            audio_input: car.features.audio_input,
            long_term_trips: car.features.long_term_trips,
            car_kit: car.features.car_kit,
            remote_central_locking: car.features.remote_central_locking,
            climate_control: car.features.climate_control,
          }
        : {},

      photos:
        car.photos?.map((p) => ({ id: p.id, photo_url: p.photo_url })) || [],

      insurance: car.CarDocument
        ? {
            company: car.CarDocument.insurance_company || null,
            idv_value: car.CarDocument.insurance_idv_value
              ? parseFloat(car.CarDocument.insurance_idv_value)
              : null,
            valid_till: car.CarDocument.insurance_valid_till || null,
            image: car.CarDocument.insurance_image || null,
          }
        : null,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getCarDetails:", error);
    res.status(500).json({
      message: "Error fetching car details",
      error: error.message,
    });
  }
};

// Update Car Details + Pricing + Insurance (Owner Host Only)
exports.updateCarDetails = async (req, res) => {
  console.log("=== UPDATE CAR DETAILS CALLED ===");
  console.log("req.body:", req.body);
  console.log("req.files:", req.files);
  console.log("req.files?.insurance_image:", req.files?.insurance_image);
  console.log("=====================================");
  const t = await Car.sequelize.transaction();
  try {
    const host_id = req.user.id;
    const {
      car_id,
      make,
      model,
      year,
      description,
      price_per_hour,
      available_from,
      available_till,
      insurance_company,
      insurance_idv_value,
      insurance_valid_till,
    } = req.body;

    if (!car_id) {
      await t.rollback();
      return res.status(400).json({ message: "car_id is required" });
    }

    // Verify ownership
    const car = await Car.findOne({
      where: { id: car_id, host_id },
      transaction: t,
    });

    if (!car) {
      await t.rollback();
      return res
        .status(403)
        .json({ message: "Unauthorized: You can only update your own car" });
    }

    // Update Car table fields
    const carUpdates = {};
    if (make !== undefined) carUpdates.make = make;
    if (model !== undefined) carUpdates.model = model;
    if (year !== undefined) carUpdates.year = year;
    if (description !== undefined) carUpdates.description = description;
    if (price_per_hour !== undefined) {
      const parsed = parseFloat(price_per_hour);
      if (isNaN(parsed) || parsed < 0) {
        await t.rollback();
        return res.status(400).json({ message: "Invalid price_per_hour" });
      }
      carUpdates.price_per_hour = parsed;
    }
    if (available_from !== undefined)
      carUpdates.available_from = available_from;
    if (available_till !== undefined)
      carUpdates.available_till = available_till;

    if (Object.keys(carUpdates).length > 0) {
      await car.update(carUpdates, { transaction: t });
    }

    // Update Insurance if any field is provided
    const hasInsuranceUpdate =
      insurance_company !== undefined ||
      insurance_idv_value !== undefined ||
      insurance_valid_till !== undefined ||
      req.files?.insurance_image;

    if (hasInsuranceUpdate) {
      let carDoc = await CarDocument.findOne({
        where: { car_id },
        transaction: t,
      });

      if (!carDoc) {
        carDoc = await CarDocument.create({ car_id }, { transaction: t });
      }

      if (insurance_company !== undefined)
        carDoc.insurance_company = insurance_company;
      if (insurance_idv_value !== undefined) {
        const parsed = parseFloat(insurance_idv_value);
        if (isNaN(parsed) || parsed < 0) {
          await t.rollback();
          return res
            .status(400)
            .json({ message: "Invalid insurance_idv_value" });
        }
        carDoc.insurance_idv_value = parsed.toFixed(2);
      }
      if (insurance_valid_till !== undefined)
        carDoc.insurance_valid_till = insurance_valid_till;
      // In updateCarDetails controller - REPLACE file handling (lines ~85-95):

      if (
        req.files?.insurance_image ||
        req.file?.fieldname === "insurance_image"
      ) {
        // ✅ Support BOTH: req.files (Native) + req.file (Web)
        const file = req.files?.insurance_image?.[0] || req.file;

        if (file) {
          const url = await uploadToS3(file);
          console.log("✅ Uploaded insurance image:", {
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
          });
          carDoc.insurance_image = url;
        }
      }

      await carDoc.save({ transaction: t });
    }

    await t.commit();

    res.status(200).json({
      message: "Car details updated successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error in updateCarDetails:", error);
    res.status(500).json({
      message: "Error updating car details",
      error: error.message,
    });
  }
};
