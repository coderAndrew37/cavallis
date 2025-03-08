const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("./logger");

// ✅ Fix CORS: Ensure frontend requests are allowed
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // ✅ Ensure this matches frontend
  methods: ["GET", "POST", "PUT", "DELETE"], // Allow common methods
  credentials: true, // ✅ This allows cookies & authentication tokens to be sent
};

exports.cors = cors(corsOptions);
exports.helmet = helmet();

// ✅ Adjust Rate Limit
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
