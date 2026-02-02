const express = require("express");
const router = express.Router();
const UserDocuments = require("./../controller/userDocument.controller");
const { verifyToken, checkRole } = require("../middleware/authmiddleware");
const multer = require("multer");

// ========= Multer setup =========
const storage = multer.memoryStorage(); // store in memory for S3
const upload = multer({ storage });

// ========= Guest Routes =========
router.post(
  "/upload-id",
  verifyToken,
  upload.single("image"),
  UserDocuments.uploadDocument,
);

router.get(
  "/get-document",
  verifyToken,
  UserDocuments.getUserDocumentsByUserId,
);

router.post(
  "/upload-profile-pic",
  verifyToken,
  upload.single("profile_pic"),
  UserDocuments.uploadProfilePic,
);

router.get(
  "/check-eligibility",
  verifyToken,
  UserDocuments.checkBookingEligibility,
);

// ========= Admin Routes =========
router.get(
  "/admin/get-pending-documents",
  verifyToken,
  checkRole("admin"),
  UserDocuments.getPendingDocuments,
);

// Legacy verify endpoint (keep for backward compatibility)
router.post(
  "/admin/verify-document/:documentId",
  verifyToken,
  checkRole("admin"),
  UserDocuments.verifyDocument,
);

// ✅ NEW: Update individual document status
router.patch(
  "/admin/update-status/:documentId",
  verifyToken,
  checkRole("admin"),
  UserDocuments.updateDocumentStatus,
);

// ✅ NEW: Bulk update multiple documents
router.post(
  "/admin/bulk-update",
  verifyToken,
  checkRole("admin"),
  UserDocuments.bulkUpdateDocuments,
);

module.exports = router;
