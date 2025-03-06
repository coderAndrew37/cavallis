const express = require("express");
const { User, validateUser } = require("../models/user");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const sendEmail = require("../utils/email");

const auth = require("../middleware/auth");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} = require("../utils/jwt");

const router = express.Router();

// ✅ Rate Limit (Anti-brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // ✅ Allow 10 login/register attempts per 15 minutes
  message: "Too many login/register attempts, please try again later.",
});

// ✅ Register User (Referral Code is Optional)
router.post("/register", authLimiter, async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).json({ message: "User already registered" });

  let referrer = null;

  // ✅ If referral code is provided, validate it
  if (req.body.referralCode) {
    referrer = await User.findOne({ referralCode: req.body.referralCode });
    if (!referrer) {
      return res.status(400).json({ message: "Invalid referral code" });
    }
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    role: req.body.role || "user",
    referralCode: null, // ✅ Default: User is NOT in the referral program yet
    referredBy: referrer ? referrer._id : null, // ✅ Store referrer if available
  });

  await user.save();

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  setAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      referralCode: user.referralCode, // Will be `null` until they opt in
      referredBy: referrer ? referrer.referralCode : null,
    },
  });
});

// ✅ Refresh Access Token
router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { userId, role } = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken(userId, role);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.json({ success: true });
  } catch {
    res.clearCookie("refreshToken", { sameSite: "None", secure: true });
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

// ✅ Login User
router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Send response
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Failed to process login request" });
  }
});

// ✅ Get Current User
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password");
  res.json(user);
});

// ✅ Logout user (clears cookies)
router.post("/logout", (req, res) => {
  clearAuthCookies(res);
  res.json({ message: "Logged out successfully" });
});

// ✅ Forgot Password
router.post("/forgot-password", authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send reset password email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail(user.email, "Password Reset Request", "forgot-password", {
      name: user.name,
      resetUrl,
    });

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res
      .status(500)
      .json({ message: "Failed to process forgot password request" });
  }
});

// ✅ Reset Password
router.post("/reset-password/:token", authLimiter, async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Validate input
  if (!password || password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long" });
  }

  try {
    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash new password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;
