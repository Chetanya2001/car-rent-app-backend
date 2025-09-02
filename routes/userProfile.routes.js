const express = require("express");
const router = express.Router();
const {
  addProfileImage,
  updateAddressBlock,
  addBankDetails,
  uploadDL,
  uploadGID,
} = require("../controller/userProfile.controller");

const { verifyToken } = require("../middleware/authmiddleware");
const multer = require("multer");

// ========= Multer setup =========
const storage = multer.memoryStorage(); // store in memory for S3
const upload = multer({ storage });

// ========= Routes =========

// Add / Update Profile Image
router.post(
  "/add-profile-image",
  verifyToken,
  upload.single("image"),
  addProfileImage
);

// Update Address
router.post("/update-address", verifyToken, updateAddressBlock);

// Add Bank Details
router.post("/add-bank-details", verifyToken, addBankDetails);

// Upload Driving License
router.post(
  "/upload-dl",
  verifyToken,
  upload.fields([
    { name: "image_FR", maxCount: 1 },
    { name: "image_BK", maxCount: 1 },
  ]),
  uploadDL
);

// Upload Govt ID
router.post(
  "/upload-govt-id",
  verifyToken,
  upload.fields([
    { name: "image_FR", maxCount: 1 },
    { name: "image_BK", maxCount: 1 },
  ]),
  uploadGID
);

module.exports = router;
