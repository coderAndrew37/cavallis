module.exports = function (req, res, next) {
  // Ensure req.user exists before checking role
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Admin privileges required" });
  }

  next(); // Proceed to the next middleware/route
};
