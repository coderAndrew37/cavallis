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

// ✅ Register User
router.post("/register", authLimiter, async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).json({ message: "User already registered" });

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    role: req.body.role || "user",
  });

  await user.save();

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  setAuthCookies(res, accessToken, refreshToken);

  res
    .status(201)
    .json({ user: { id: user._id, name: user.name, email: user.email } });
});

// ✅ Login User
router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Invalid email or password" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res.status(400).json({ message: "Invalid email or password" });

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  setAuthCookies(res, accessToken, refreshToken);

  res.json({ user: { id: user._id, name: user.name, email: user.email } });
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

// ✅ Logout User
router.post("/logout", (req, res) => {
  clearAuthCookies(res);
  res.json({ message: "Logged out successfully" });
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

module.exports = router;
