const { UserDocuments, User } = require("../models");
const { uploadToS3 } = require("../utils/s3Upload"); // Your helper

exports.uploadDocument = async (req, res) => {
  try {
    const { doc_type } = req.body;
    const user_id = req.user.id;

    const allowedTypes = [
      "Passport",
      "Driver's License",
      "National ID Card",
      "Voter Card",
      "PAN Card",
      "Other",
    ];
    if (!allowedTypes.includes(doc_type)) {
      return res.status(400).json({ message: "Invalid document type" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Upload image to S3 and get URL
    const imageUrl = await uploadToS3(req.file);

    const document = await UserDocuments.create({
      user_id,
      doc_type,
      image: imageUrl,
      verification_status: "Pending",
    });

    return res.status(201).json({
      message: "Document uploaded",
      document,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Document upload failed" });
  }
};

exports.getUserDocumentsByUserId = async (req, res) => {
  try {
    // Check if authenticated user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const userId = req.body.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ message: "userId query parameter required" });
    }

    // Optional: Verify user exists
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const documents = await UserDocuments.findAll({
      where: { user_id: userId },
      attributes: [
        "id",
        "doc_type",
        "image",
        "verification_status",
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
