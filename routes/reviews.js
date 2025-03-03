const express = require("express");
const { Review, validateReview } = require("../models/review");
const { Product } = require("../models/product");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const upload = require("../utils/upload"); // Multer for image uploads
const router = express.Router();

// Create a review (user only)
router.post("/", upload.single("image"), async (req, res) => {
  const { error } = validateReview(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    // Check if the product exists (if productId is provided)
    if (req.body.productId) {
      const product = await Product.findById(req.body.productId);
      if (!product) return res.status(404).json({ error: "Product not found" });
    }

    // Create the review
    const review = new Review({
      userId: req.body.userId || null, // Optional for general reviews
      productId: req.body.productId || null, // Optional for general reviews
      name: req.body.name, // User's name for general reviews
      rating: req.body.rating,
      comment: req.body.comment,
      image: req.file ? req.file.path : null, // Save the file path if image is uploaded
      isApproved: false, // Default to false for admin approval
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Get all approved reviews (sorted by rating and likes)
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const reviews = await Review.find({ isApproved: true })
      .sort({ rating: -1, likes: -1 }) // Sort by rating (desc) and likes (desc)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalReviews = await Review.countDocuments({ isApproved: true });
    const totalPages = Math.ceil(totalReviews / limit);

    res.json({
      reviews,
      currentPage: page,
      totalPages,
      totalReviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Like a review (user only)
router.post("/:id/like", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    // Increment likes
    review.likes += 1;
    await review.save();

    res.json({ message: "Review liked successfully", likes: review.likes });
  } catch (error) {
    console.error("Error liking review:", error);
    res.status(500).json({ error: "Failed to like review" });
  }
});

// Approve a review (admin only)
router.patch("/:id/approve", auth, isAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    if (!review) return res.status(404).json({ error: "Review not found" });
    res.json({ message: "Review approved successfully", review });
  } catch (error) {
    console.error("Error approving review:", error);
    res.status(500).json({ error: "Failed to approve review" });
  }
});

module.exports = router;
