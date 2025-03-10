const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("./logger");

// ✅ Debug CORS: Log applied origins
const corsOptions = {
  origin: (origin, callback) => {
    logger.info(`CORS request from: ${origin}`);
    if (
      !origin ||
      origin === process.env.FRONTEND_URL ||
      origin === "http://localhost:5173"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ Explicitly allow OPTIONS
  credentials: true, // ✅ Allow cookies/tokens
};

// ✅ Apply CORS with logging & error handling
const corsMiddleware = cors(corsOptions);

exports.cors = (req, res, next) => {
  corsMiddleware(req, res, (err) => {
    if (err) {
      logger.error(`CORS Error: ${err.message}`);
      res.status(403).json({ message: "CORS policy blocked this request" });
    } else {
      next();
    }
  });
};

exports.helmet = helmet();

// ✅ Adjust Rate Limiting
const isDevelopment = process.env.NODE_ENV === "development";

exports.limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ✅ 15 minutes
  max: isDevelopment ? 1000 : 500, // ✅ Allow more requests in production
  standardHeaders: true, // ✅ Return RateLimit headers
  legacyHeaders: false,
  keyGenerator: (req) => req.ip, // ✅ Rate-limit by IP
  skip: (req) => req.method === "GET", // ✅ Do NOT rate-limit GET requests
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests, slow down!",
    });
    logger.warn(`Rate limit exceeded: ${req.ip}`);
  },
});
