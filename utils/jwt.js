require("dotenv").config();
const jwt = require("jsonwebtoken");

// 🔹 Generate Access Token (Short-lived)
const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m", // 15 minutes
  });
};

// 🔹 Generate Refresh Token (Long-lived)
const generateRefreshToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d", // 7 days
  });
};

// 🔹 Verify Access Token
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

// 🔹 Verify Refresh Token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// 🔹 Set Secure HTTP-Only Cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
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
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
