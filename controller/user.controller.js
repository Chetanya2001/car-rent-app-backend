// controllers/userController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { User } = require("../models");

// Register user
exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, role } = req.body;

    // ensure role is valid
    if (!["admin", "host", "guest"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // check duplicate email
    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "Email already in use" });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      email,
      phone,
      password_hash: hashedPassword,
      role,
    });

    // send verification email (example with Gmail SMTP)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: `"Car Rent App" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Verify your email",
      html: `<p>Hello ${first_name}, click <a href="${verifyUrl}">here</a> to verify your account.</p>`,
    });

    return res
      .status(201)
      .json({ message: "User registered. Verification email sent." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Registration failed" });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid email" });

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass)
      return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "12h",
      }
    );

    return res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login failed" });
  }
};

// Password reset request
exports.passReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User does not exist" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Car Rent App" <${process.env.GMAIL_USER}>`,
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

// Get user profile
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

// Get all users (admin only)
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
