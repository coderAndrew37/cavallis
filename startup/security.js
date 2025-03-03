const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

// Enable CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
};
exports.cors = cors(corsOptions);

// Set security headers using Helmet
exports.helmet = helmet();

// Rate limiting to prevent brute force attacks
exports.limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
