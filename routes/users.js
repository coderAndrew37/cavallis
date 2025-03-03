const express = require("express");
const { User, validateUser } = require("../models/user");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
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

module.exports = router;
