const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("./logger");

// ✅ Fix CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    logger.info(`CORS request from: ${origin}`);
    if (
      !origin ||
      process.env.FRONTEND_URL.includes(origin) ||
      origin === "http://localhost:5173"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ Ensure OPTIONS requests work
  allowedHeaders: ["Content-Type", "Authorization"], // ✅ Allow custom headers
  credentials: true, // ✅ Allow cookies
};

// ✅ Apply CORS Middleware
exports.cors = cors(corsOptions);
exports.helmet = helmet();

// ✅ Adjust Rate Limiting
const isDevelopment = process.env.NODE_ENV === "development";

exports.limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ✅ 15 minutes
  max: isDevelopment ? 1000 : 500, // ✅ Allow more requests in dev
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  skip: (req) => req.method === "GET", // ✅ Do NOT rate-limit GET requests
  handler: (req, res) => {
    res
      .status(429)
      .json({ message: "Too many requests, please try again later." });
    logger.warn(`Rate limit exceeded: ${req.ip}`);
  },
});
