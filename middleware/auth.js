const { verifyAccessToken } = require("../utils/jwt");

module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided" });

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Add user payload to request object
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};
