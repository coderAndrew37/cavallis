const express = require("express");
const { User, validateUser } = require("../models/user");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const crypto = require("crypto");
const sendEmail = require("../utils/email");
const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  // Validate request body
  const { error } = validateUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  // Check if user already exists
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).json({ message: "User already registered" });

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // Create new user
  user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    role: req.body.role || "user", // Default role is "user"
  });

  await user.save();

  // Generate tokens (auto-login after registration)
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  // Send response
  res.status(201).json({ accessToken, refreshToken });
});

// Login user
router.post("/login", async (req, res) => {
  // Validate request body
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Invalid email or password" });

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res.status(400).json({ message: "Invalid email or password" });

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  // Send response
  res.json({ accessToken, refreshToken });
});

// Refresh access token
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token is required" });

  try {
    // Verify refresh token
    const { userId, role } = verifyRefreshToken(refreshToken);

    // Generate new access token
    const accessToken = generateAccessToken(userId, role);
    res.json({ accessToken });
  } catch (error) {
    res.status(400).json({ message: "Invalid refresh token" });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password");
  res.json(user);
});

// Logout user (optional, since JWT tokens are stateless)
router.post("/logout", auth, async (req, res) => {
  // In a stateless system, logout is handled client-side by deleting the token
  res.json({ message: "Logged out successfully" });
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // Find the user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour

    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/${resetToken}`;
    const subject = "Password Reset Request";
    const text = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}`;
    await sendEmail(user.email, subject, text);

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res
      .status(500)
      .json({ error: "Failed to process forgot password request" });
  }
});

// Reset password
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password)
    return res.status(400).json({ message: "Password is required" });

  try {
    // Find the user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is still valid
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

module.exports = router;
