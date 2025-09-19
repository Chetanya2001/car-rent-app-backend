const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { User } = require("../models");

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
      { expiresIn: "1d" }
    );

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: `"Car Rent App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Hello ${first_name},</h2>
          <p>Click the link below to verify your account:</p>
          <a href="${verifyUrl}"
             style="background: #4CAF50; color: white; padding: 10px 15px; 
                    text-decoration: none; border-radius: 5px;">
            Verify Account
          </a>
          <p style="margin-top:20px;">Or copy this token:</p>
          <p style="font-size:16px; font-weight:bold; color:#d9534f;">
            ${token}
          </p>
          <p>If you didn’t register, ignore this email.</p>
        </div>
      `,
    });

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
      { expiresIn: "12h" }
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
    return res.status(400).json({ message: "❌ Invalid or expired token" });
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
      from: `"Car Rent App" <${process.env.EMAIL_USER}>`,
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
      ],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Profile fetch failed" });
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
    });
    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};
