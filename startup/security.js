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
exports.limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
