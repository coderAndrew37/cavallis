const { verifyAccessToken } = require("../utils/jwt");

module.exports = function (req, res, next) {
  // Get token from cookies or header
  const token = req.cookies?.accessToken || req.header("x-auth-token");

  // Check if no token
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided" });
  }

  try {
    // Verify the token
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Add user payload to request object
    next(); // Proceed to the next middleware/route
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired. Please log in again" });
    }
    res.status(401).json({ message: "Invalid token" });
  }
};
