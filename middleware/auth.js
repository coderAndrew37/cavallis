const { verifyAccessToken } = require("../utils/jwt");

module.exports = function (req, res, next) {
  // ✅ Get token from cookies or header
  const token = req.cookies?.accessToken || req.header("x-auth-token");

  // ✅ If no token, return 401 (Unauthorized)
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // ✅ Verify the token
    const decoded = verifyAccessToken(token);
    req.user = decoded; // ✅ Attach user payload to request
    next(); // ✅ Proceed to next middleware/route
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired. Please log in again." });
    }
    res.status(401).json({ message: "Invalid token." });
  }
};
