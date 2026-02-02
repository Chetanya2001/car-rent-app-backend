const { UserDocuments, User } = require("../models");
const { uploadToS3 } = require("../utils/s3Upload");

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    const { doc_type } = req.body;
    const user_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to S3
    const imageUrl = await uploadToS3(req.file, "documents");

    // Check if document already exists
    const existingDoc = await UserDocuments.findOne({
      where: { user_id, doc_type },
    });

    if (existingDoc) {
      // Update existing document
      await existingDoc.update({
        image: imageUrl,
        verification_status: "Pending",
        rejection_reason: null,
      });

      return res.status(200).json({
        message: "Document re-uploaded successfully",
        document: existingDoc,
      });
    }

    // Create new document
    const document = await UserDocuments.create({
      user_id,
      doc_type,
      image: imageUrl,
      verification_status: "Pending",
    });

    res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
};

// Get user's documents
exports.getUserDocumentsByUserId = async (req, res) => {
  try {
    const user_id = req.user.id;

    const documents = await UserDocuments.findAll({
      where: { user_id },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(documents);
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};

// Upload profile picture
exports.uploadProfilePic = async (req, res) => {
  try {
    const user_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to S3
    const imageUrl = await uploadToS3(req.file, "profile-pics");

    // Update user profile
    await User.update(
      { profile_picture: imageUrl },
      { where: { id: user_id } },
    );

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      imageUrl,
    });
  } catch (error) {
    console.error("Upload profile pic error:", error);
    res.status(500).json({ error: "Failed to upload profile picture" });
  }
};

// Get all pending documents (Admin)
exports.getPendingDocuments = async (req, res) => {
  try {
    const documents = await UserDocuments.findAll({
      where: { verification_status: "Pending" },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(documents);
  } catch (error) {
    console.error("Get pending documents error:", error);
    res.status(500).json({ error: "Failed to fetch pending documents" });
  }
};

// Verify document (Admin) - Legacy endpoint
exports.verifyDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, rejection_reason } = req.body;

    if (!["Verified", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const document = await UserDocuments.findByPk(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    await document.update({
      verification_status: status,
      rejection_reason: status === "Rejected" ? rejection_reason : null,
    });

    // If all documents are verified, update user verification status
    if (status === "Verified") {
      const userDocuments = await UserDocuments.findAll({
        where: { user_id: document.user_id },
      });

      const allVerified = userDocuments.every(
        (doc) => doc.verification_status === "Verified",
      );

      if (allVerified && userDocuments.length > 0) {
        await User.update(
          { is_verified: true },
          { where: { id: document.user_id } },
        );
      }
    }

    res.status(200).json({
      message: "Document status updated successfully",
      document,
    });
  } catch (error) {
    console.error("Verify document error:", error);
    res.status(500).json({ error: "Failed to update document status" });
  }
};

// ✅ NEW: Update document status (Admin) - Bulk update
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, rejection_reason } = req.body;

    // Validate status
    if (!["Pending", "Verified", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Find document
    const document = await UserDocuments.findByPk(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Update document
    await document.update({
      verification_status: status,
      rejection_reason: status === "Rejected" ? rejection_reason : null,
    });

    // Auto-verify user if all documents are verified
    if (status === "Verified") {
      const userDocuments = await UserDocuments.findAll({
        where: { user_id: document.user_id },
      });

      const allVerified = userDocuments.every(
        (doc) => doc.verification_status === "Verified",
      );

      if (allVerified && userDocuments.length > 0) {
        await User.update(
          { is_verified: true },
          { where: { id: document.user_id } },
        );
      }
    } else if (status === "Rejected" || status === "Pending") {
      // If any document is rejected or pending, set user as unverified
      await User.update(
        { is_verified: false },
        { where: { id: document.user_id } },
      );
    }

    res.status(200).json({
      message: "Document status updated successfully",
      document,
    });
  } catch (error) {
    console.error("Update document status error:", error);
    res.status(500).json({ error: "Failed to update document status" });
  }
};

// ✅ NEW: Bulk update multiple documents
exports.bulkUpdateDocuments = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { documentId, status, rejection_reason }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { documentId, status, rejection_reason } = update;

        // Validate status
        if (!["Pending", "Verified", "Rejected"].includes(status)) {
          errors.push({ documentId, error: "Invalid status" });
          continue;
        }

        const document = await UserDocuments.findByPk(documentId);

        if (!document) {
          errors.push({ documentId, error: "Document not found" });
          continue;
        }

        await document.update({
          verification_status: status,
          rejection_reason: status === "Rejected" ? rejection_reason : null,
        });

        results.push({ documentId, status: "updated" });
      } catch (err) {
        errors.push({ documentId: update.documentId, error: err.message });
      }
    }

    // Check user verification status for affected users
    const userIds = [...new Set(updates.map((u) => u.userId))].filter(Boolean);

    for (const userId of userIds) {
      const userDocuments = await UserDocuments.findAll({
        where: { user_id: userId },
      });

      const allVerified = userDocuments.every(
        (doc) => doc.verification_status === "Verified",
      );

      const hasRejectedOrPending = userDocuments.some((doc) =>
        ["Rejected", "Pending"].includes(doc.verification_status),
      );

      if (allVerified && userDocuments.length > 0) {
        await User.update({ is_verified: true }, { where: { id: userId } });
      } else if (hasRejectedOrPending) {
        await User.update({ is_verified: false }, { where: { id: userId } });
      }
    }

    res.status(200).json({
      message: "Bulk update completed",
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({ error: "Failed to perform bulk update" });
  }
};

// Check booking eligibility
exports.checkBookingEligibility = async (req, res) => {
  try {
    const user_id = req.user.id;

    const user = await User.findByPk(user_id, {
      include: [
        {
          model: UserDocuments,
          as: "documents",
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hasDocuments = user.documents && user.documents.length > 0;
    const allVerified =
      hasDocuments &&
      user.documents.every((doc) => doc.verification_status === "Verified");

    const isEligible = user.is_verified && allVerified;

    res.status(200).json({
      isEligible,
      user_verified: user.is_verified,
      documents_count: user.documents ? user.documents.length : 0,
      all_documents_verified: allVerified,
      documents: user.documents || [],
    });
  } catch (error) {
    console.error("Check eligibility error:", error);
    res.status(500).json({ error: "Failed to check eligibility" });
  }
};
