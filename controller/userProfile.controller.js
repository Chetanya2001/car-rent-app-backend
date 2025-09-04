// controllers/userProfileController.js
const { UserProfile, UserBankDetails, UserDocuments } = require("../models");
const { uploadToS3 } = require("../utils/s3Upload");

// ================== Add Profile Image ==================
exports.addProfileImage = async (req, res) => {
  try {
    // Get user_id from token (auth middleware should set req.user)
    const user_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imageUrl = await uploadToS3(req.file);

    let profile = await UserProfile.findOne({ where: { user_id } });
    if (!profile) {
      profile = await UserProfile.create({ user_id, profile_image: imageUrl });
    } else {
      profile.profile_image = imageUrl;
      await profile.save();
    }

    res.status(200).json({ message: "Profile image updated", profile });
  } catch (error) {
    res.status(500).json({
      message: "Error adding profile image",
      error: error.message,
    });
  }
};

// ================== Update Address ==================
exports.updateAddressBlock = async (req, res) => {
  try {
    // Take user_id from JWT (set by auth middleware)
    const user_id = req.user.id;
    const { arr_address } = req.body;

    let profile = await UserProfile.findOne({ where: { user_id } });
    if (!profile) {
      profile = await UserProfile.create({ user_id, address: arr_address });
    } else {
      profile.address = arr_address;
      await profile.save();
    }

    res.status(200).json({ message: "Address updated", profile });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating address", error: error.message });
  }
};

// ================== Add Bank Details ==================
exports.addBankDetails = async (req, res) => {
  try {
    // Always take from JWT (set by auth middleware)
    const user_id = req.user.id;
    const { account_name, account_no, bank_name, ifsc } = req.body;

    const bankDetails = await UserBankDetails.create({
      user_id,
      account_name,
      account_no,
      bank_name,
      ifsc,
    });

    res.status(201).json({ message: "Bank details added", bankDetails });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding bank details", error: error.message });
  }
};

// ================== Upload Driving License ==================
exports.uploadDL = async (req, res) => {
  try {
    const user_id = req.user.id;

    if (!req.files || !req.files.image_FR || !req.files.image_BK) {
      return res
        .status(400)
        .json({ message: "Both front and back images required" });
    }

    const frontUrl = await uploadToS3(req.files.image_FR[0]);
    const backUrl = await uploadToS3(req.files.image_BK[0]);

    const dlDoc = await UserDocuments.create({
      user_id: user_id,
      doc_type: "DL",
      image_fr: frontUrl,
      image_bk: backUrl,
    });

    res.status(201).json({ message: "Driving License uploaded", dlDoc });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading DL", error: error.message });
  }
};

// ================== Upload Govt ID ==================
exports.uploadGID = async (req, res) => {
  try {
    const user_id = req.user.id;

    if (!req.files || !req.files.image_FR || !req.files.image_BK) {
      return res
        .status(400)
        .json({ message: "Both front and back images required" });
    }

    const frontUrl = await uploadToS3(req.files.image_FR[0]);
    const backUrl = await uploadToS3(req.files.image_BK[0]);

    const gidDoc = await UserDocuments.create({
      user_id: user_id,
      doc_type: "GovtID",
      image_fr: frontUrl,
      image_bk: backUrl,
    });

    res.status(201).json({ message: "Govt ID uploaded", gidDoc });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading Govt ID", error: error.message });
  }
};
