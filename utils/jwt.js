require("dotenv").config();
const jwt = require("jsonwebtoken");

// 🔹 Generate Access Token (Short-lived)
const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m", // 15 minutes
  });
};

// 🔹 Generate Refresh Token (Longer-lived)
const generateRefreshToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d", // 7 days
  });
};

// 🔹 Set Secure HTTP-Only Cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: "None", // ✅ Needed for cross-origin requests
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// 🔹 Clear Auth Cookies (Logout)
const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", { sameSite: "None", secure: true });
  res.clearCookie("refreshToken", { sameSite: "None", secure: true });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
