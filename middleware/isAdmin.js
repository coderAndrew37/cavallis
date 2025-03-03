module.exports = function (req, res, next) {
  // Check if the user is an admin
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Admin privileges required" });
  }
  next(); // Proceed to the next middleware/route
};
