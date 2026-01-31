const { UserDocuments, User } = require("../models");
const { uploadToS3 } = require("../utils/s3Upload"); // Your helper

const REQUIRED_DOCS = ["Aadhaar", "Driver's License"];

exports.uploadDocument = async (req, res) => {
  try {
    const { doc_type } = req.body;
    const user_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "Document image is required" });
    }

    const imageUrl = await uploadToS3(req.file);

    const [document, created] = await UserDocuments.upsert(
      {
        user_id,
        doc_type,
        image: imageUrl,
        verification_status: "Pending",
        rejection_reason: null,
      },
      { returning: true },
    );

    return res.status(201).json({
      message: created
        ? "Document uploaded successfully"
        : "Document updated and sent for re-verification",
      document,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Document upload failed" });
  }
};

exports.getUserDocumentsByUserId = async (req, res) => {
  try {
    const userId = req.user.id; // get user id directly from token

    if (!userId) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    // Optional: fetch user details if needed
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const documents = await UserDocuments.findAll({
      where: { user_id: userId },
      attributes: [
        "id",
        "doc_type",
        "image",
        "verification_status",
        "rejection_reason",
        "createdAt",
        "updatedAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({ user: { id: user.id, email: user.email }, documents });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch user documents" });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    // Upload image to S3
    const imageUrl = await uploadToS3(req.file);

    // Update user profile_pic
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profile_pic = imageUrl;
    await user.save();

    return res.json({
      message: "Profile picture uploaded successfully",
      profile_pic: imageUrl,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Profile picture upload failed" });
  }
};
exports.getPendingDocuments = async (req, res) => {
  const guests = await User.findAll({
    where: { role: "guest" },
    include: [
      {
        model: UserDocuments,
        as: "documents",
        attributes: ["verification_status"],
      },
    ],
  });

  const response = guests.map((g) => {
    const pending = g.documents.filter(
      (d) => d.verification_status === "Pending",
    ).length;

    const verified = g.documents.filter(
      (d) => d.verification_status === "Verified",
    ).length;

    return {
      id: g.id,
      first_name: g.first_name,
      last_name: g.last_name,
      email: g.email,
      phone: g.phone,
      hasPendingVerification: pending > 0,
      pendingDocs: pending,
      verifiedDocs: verified,
    };
  });
};

exports.verifyDocument = async (req, res) => {
  const { documentId } = req.params;
  const { status, rejection_reason } = req.body;

  if (!["Verified", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const document = await UserDocuments.findByPk(documentId);
  if (!document) return res.status(404).json({ message: "Not found" });

  document.verification_status = status;
  document.rejection_reason = status === "Rejected" ? rejection_reason : null;
  await document.save();

  res.json({ message: "Document status updated", document });
};

exports.checkBookingEligibility = async (req, res) => {
  const userId = req.user.id;

  const documents = await UserDocuments.findAll({
    where: {
      user_id: userId,
      doc_type: REQUIRED_DOCS,
    },
  });

  const docMap = documents.reduce((acc, doc) => {
    acc[doc.doc_type] = doc.verification_status;
    return acc;
  }, {});

  const missingDocs = REQUIRED_DOCS.filter((doc) => !docMap[doc]);

  const unverifiedDocs = REQUIRED_DOCS.filter(
    (doc) => docMap[doc] !== "Verified",
  );

  if (missingDocs.length || unverifiedDocs.length) {
    return res.status(403).json({
      eligible: false,
      reason: "DOCUMENT_VERIFICATION_REQUIRED",
      missingDocs,
      unverifiedDocs,
      message: "User must complete document verification before booking",
    });
  }

  return res.json({
    eligible: true,
    message: "User is eligible to proceed with payment",
  });
};
