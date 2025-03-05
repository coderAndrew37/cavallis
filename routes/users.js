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

// ✅ Get Current User
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password");
  res.json(user);
});

// ✅ Opt-in to Referral Program (Authenticated Users)
router.post("/referral/opt-in", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ If user already has a referral code, prevent generating a new one
    if (user.referralCode) {
      return res
        .status(400)
        .json({ message: "You are already in the referral program" });
    }

    // ✅ Generate a unique referral code
    user.referralCode = generateReferralCode();
    await user.save();

    res.json({
      message: "You have joined the referral program!",
      referralCode: user.referralCode,
    });
  } catch (error) {
    console.error("Error opting into referral program:", error);
    res.status(500).json({ message: "Failed to opt into referral program" });
  }
});

// ✅ Logout user (clears cookies)
router.post("/logout", (req, res) => {
  clearAuthCookies(res);
  res.json({ message: "Logged out successfully" });
});

// ✅ Forgot password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject = "Password Reset Request";
    const text = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}`;

    await sendEmail(user.email, subject, "forgot-password", {
      name: user.name,
      resetUrl,
    });

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res
      .status(500)
      .json({ error: "Failed to process forgot password request" });
  }
});

// ✅ Reset password
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password)
    return res.status(400).json({ message: "Password is required" });

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// ✅ Function to Generate a Unique Referral Code
function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase(); // Example: "A1B2C3"
}

module.exports = router;
