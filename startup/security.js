const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ✅ Fix CORS: Ensure frontend requests are allowed
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // ✅ Make sure this matches frontend
  credentials: true, // ✅ This allows cookies to be sent
};

exports.cors = cors(corsOptions);
exports.helmet = helmet();

// Rate limiting with environment-specific configurations
const isDevelopment = process.env.NODE_ENV === "development";

exports.limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Higher limit in development
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests, please try again later.",
    });
    logger.warn(`Rate limit exceeded by IP: ${req.ip}`);
  },
});
