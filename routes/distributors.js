const express = require("express");
const { Distributor, validateDistributor } = require("../models/distributor");
const { User } = require("../models/user");
const auth = require("../middleware/auth");
const router = express.Router();

// Apply to become a distributor
router.post("/apply", auth, async (req, res) => {
  const { error } = validateDistributor(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    // Check if the user already applied
    const existingDistributor = await Distributor.findOne({
      userId: req.user.userId,
    });
    if (existingDistributor)
      return res.status(400).json({ error: "You have already applied" });

    // Create the distributor application
    const distributor = new Distributor({
      userId: req.user.userId,
      businessName: req.body.businessName,
      contactInfo: req.body.contactInfo,
    });

    await distributor.save();
    res.status(201).json(distributor);
  } catch (error) {
    console.error("Error applying to become a distributor:", error);
    res.status(500).json({ error: "Failed to apply" });
  }
});

// Get all distributors with pagination and filtering
router.get("/", auth, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const status = req.query.status; // Optional status filter

  // Build filter
  const filter = {};
  if (status) filter.status = status;

  try {
    const distributors = await Distributor.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalDistributors = await Distributor.countDocuments(filter);
    const totalPages = Math.ceil(totalDistributors / limit);

    res.json({
      distributors,
      currentPage: page,
      totalPages,
      totalDistributors,
    });
  } catch (error) {
    console.error("Error fetching distributors:", error);
    res.status(500).json({ error: "Failed to fetch distributors" });
  }
});

// Get distributor by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const distributor = await Distributor.findById(req.params.id).lean();
    if (!distributor)
      return res.status(404).json({ error: "Distributor not found" });
    res.json(distributor);
  } catch (error) {
    console.error("Error fetching distributor:", error);
    res.status(500).json({ error: "Failed to fetch distributor" });
  }
});

// Update distributor status (admin only)
router.patch("/:id/status", auth, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required" });

  try {
    const distributor = await Distributor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();

    if (!distributor)
      return res.status(404).json({ error: "Distributor not found" });

    res.json(distributor);
  } catch (error) {
    console.error("Error updating distributor status:", error);
    res.status(500).json({ error: "Failed to update distributor status" });
  }
});

// Delete a distributor (admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const distributor = await Distributor.findByIdAndDelete(req.params.id);
    if (!distributor)
      return res.status(404).json({ error: "Distributor not found" });
    res.json({ message: "Distributor deleted successfully" });
  } catch (error) {
    console.error("Error deleting distributor:", error);
    res.status(500).json({ error: "Failed to delete distributor" });
  }
});

module.exports = router;
