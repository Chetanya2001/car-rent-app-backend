const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { User, UserProfile, UserDocuments } = require("../models");
// const { sendWhatsAppVerification } = require("../utils/whatsappService");

// 🔹 Common transporter (Hostinger SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // smtp.hostinger.com
  port: process.env.EMAIL_PORT, // 465 or 587
  secure: process.env.EMAIL_SECURE === "true", // true if using 465
  auth: {
    user: process.env.EMAIL_USER, // support@zipdrive.in
    pass: process.env.EMAIL_PASS, // Support987#
  },
});

// ======================= REGISTER =======================
exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, role } = req.body;

    if (!["admin", "host", "guest"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      email,
      phone,
      password_hash: hashedPassword,
      role,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: `"Zip Drive Support Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verification from Zip Drive",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Hello ${first_name},</h2>
          <p>Click the link below to verify your account:</p>
          <a href="${verifyUrl}"
             style="background: #4CAF50; color: white; padding: 10px 15px; 
                    text-decoration: none; border-radius: 5px;">
            Verify Account
          </a>
          <p>If you didn’t register, ignore this email.</p>
        </div>
      `,
    });
    // await sendWhatsAppVerification(phone, first_name, verifyUrl);

    return res.status(201).json({
      message: "User registered. Verification email sent.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Registration failed" });
  }
};

// ======================= LOGIN =======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid email" });

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass)
      return res.status(401).json({ message: "Invalid password" });

    if (!user.is_verified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" },
    );

    return res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login failed" });
  }
};

// ======================= VERIFY EMAIL =======================
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) return res.status(400).json({ message: "Token required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.is_verified) {
      return res.json({ message: "Email already verified" });
    }

    user.is_verified = true;
    await user.save();

    return res.json({ message: "✅ Email verified successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "❌ Invalid expired token" });
  }
};

// ======================= PASSWORD RESET =======================
exports.passReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User does not exist" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Zip Drive Support Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset",
      html: `<p>Hello ${user.first_name}, click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });

    return res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Reset request failed" });
  }
};

// ======================= PROFILE =======================
exports.profile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "role",
        "is_verified",
        "whatsapp_verified",
        "profile_pic", // ✅ include profile picture
        "createdAt",
        "updatedAt",
      ],
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile fetch failed:", error);
    return res.status(500).json({
      success: false,
      message: "Profile fetch failed",
    });
  }
};

// ======================= ALL USERS (ADMIN) =======================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "role",
        "is_verified",
      ],
      include: [
        {
          model: UserDocuments,
          as: "documents",
          attributes: ["verification_status"],
          required: false,
        },
      ],
    });
    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

// ======================= SUPPORT CONTACT =======================
exports.sendSupportMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Optional validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Construct email contents
    await transporter.sendMail({
      from: `"Zip Drive Support" <${process.env.EMAIL_USER}>`,
      to: process.env.SUPPORT_RECEIVER || process.env.EMAIL_USER, // Where you want to receive support messages
      subject: `[Support Request] ${subject}`,
      replyTo: email,
      html: `
<div style="font-family: Arial, sans-serif;">
 <h2>Support Request</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
 <p><strong>Subject:</strong> ${subject}</p>
 <p><strong>Message:</strong></p>
 <div style="white-space:pre-line;">${message}</div> </div>
 `,
    });

    return res.json({
      message: "Support message sent. We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Support form error:", error);
    return res.status(500).json({ message: "Failed to send support message" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id; // or req.user.id if deleting logged-in user

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Destroy associated documents
    await UserDocuments.destroy({ where: { user_id: userId } });

    // Destroy associated profile
    await UserProfile.destroy({ where: { user_id: userId } });

    await user.destroy();

    return res.json({
      message: "User and all associated data deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete user." });
  }
};

// ======================= ALL HOSTS (ADMIN) =======================
exports.getAllHosts = async (req, res) => {
  try {
    const hosts = await User.findAll({
      where: { role: "host" },
      attributes: [
        "id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "role",
        "is_verified",
      ],
    });
    return res.json(hosts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch hosts" });
  }
};

// ======================= UPDATE USER (ADMIN) =======================
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Define updatable fields
    const updatableFields = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "role",
      "is_verified",
      "whatsapp_verified",
      "profile_pic",
    ];

    // Extract only allowed fields from req.body
    const updates = {};
    updatableFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Optionally: Prevent changing email to one already in use (for uniqueness)
    if (updates.email && updates.email !== user.email) {
      const emailExists = await User.findOne({
        where: { email: updates.email },
      });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use." });
      }
    }

    // Update and save
    Object.assign(user, updates);
    await user.save();

    return res.json({ message: "User updated successfully.", user });
  } catch (error) {
    console.error("User update failed:", error);
    return res.status(500).json({ message: "Failed to update user." });
  }
};
