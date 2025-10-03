const express = require("express");
const router = express.Router();
const UserDocuments = require("./../controller/userDocument.controller");
const { verifyToken, checkRole } = require("../middleware/authmiddleware");
const multer = require("multer");

// ========= Multer setup =========
const storage = multer.memoryStorage(); // store in memory for S3
const upload = multer({ storage });
// Make sure to use the upload.single middleware for 'image'
router.post(
  "/upload-id",
  verifyToken,
  upload.single("image"),
  UserDocuments.uploadDocument
);

router.get(
  "/get-document",
  verifyToken,
  checkRole(["admin"]),
  UserDocuments.getUserDocumentsByUserId
);
router.post(
  "/upload-profile-pic",
  verifyToken,
  upload.single("profile_pic"),
  UserDocuments.uploadProfilePic
);

module.exports = router;
