const { Car, CarDocument, CarPhoto } = require("../models");
const { uploadToS3 } = require("../utils/s3Upload");
// Add Car
exports.addCar = async (req, res) => {
  try {
    const { make, model, year, kms_driven, rc_number, host_id } = req.body;

    const car = await Car.create({
      make,
      model,
      year,
      kms_driven,
      rc_number,
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
    const { car_id } = req.body;

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
      });
    } else {
      // Update existing RC document
      carDoc.rc_image_front = rcFrontUrl;
      carDoc.rc_image_back = rcBackUrl;
      await carDoc.save();
    }

    res.status(200).json({
      message: "RC images uploaded successfully",
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
    const { car_id, insurance_image } = req.body;

    await CarDocument.update({ insurance_image }, { where: { car_id } });

    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(500).json({
      message: "Error uploading insurance",
      error: error.message,
      status: "error",
    });
  }
};

// Upload Car Images
exports.addImage = async (req, res) => {
  try {
    const { car_id, images } = req.body;

    if (!images || images.length < 4) {
      return res.status(400).json({ error: "At least 4 images are required" });
    }

    const carPhotos = images.map((img) => ({ car_id, car_image: img }));
    await CarPhoto.bulkCreate(carPhotos);

    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(500).json({
      message: "Error uploading car images",
      error: error.message,
      status: "error",
    });
  }
};

// Upload FastTAG
exports.addFastTag = async (req, res) => {
  try {
    const { car_id, fasttag_number } = req.body;

    await CarDocument.update({ fasttag_number }, { where: { car_id } });

    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(500).json({
      message: "Error uploading FastTAG",
      error: error.message,
      status: "error",
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
