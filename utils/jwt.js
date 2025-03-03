require("dotenv").config();
const jwt = require("jsonwebtoken");

// Generate access token
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, config.get("jwtAccessSecret"), {
    expiresIn: "15m", // Access token expires in 15 minutes
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.get("jwtRefreshSecret"), {
    expiresIn: "7d", // Refresh token expires in 7 days
  });
};

// Verify access token
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.get("jwtAccessSecret"));
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.get("jwtRefreshSecret"));
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
