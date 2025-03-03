const express = require("express");
const { Review, validateReview } = require("../models/review");
const { Product } = require("../models/product");
const auth = require("../middleware/auth");
const router = express.Router();

// Create a review
router.post("/", auth, async (req, res) => {
  const { error } = validateReview(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    // Check if the product exists
    const product = await Product.findById(req.body.productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Create the review
    const review = new Review({
      userId: req.user.userId,
      productId: req.body.productId,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    await review.save();

    // Update the product's average rating
    await updateProductRating(req.body.productId);

    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Helper function to update product's average rating
async function updateProductRating(productId) {
  const reviews = await Review.find({ productId });
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  await Product.findByIdAndUpdate(productId, { rating: averageRating });
}

// Get all reviews for a product
router.get("/product/:productId", async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalReviews = await Review.countDocuments({
      productId: req.params.productId,
    });
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

// Update a review
router.put("/:id", auth, async (req, res) => {
  const { error } = validateReview(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId }, // Ensure the user can only update their own review
      { rating: req.body.rating, comment: req.body.comment },
      { new: true }
    );

    if (!review) return res.status(404).json({ error: "Review not found" });

    // Update the product's average rating
    await updateProductRating(review.productId);

    res.json(review);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
});

// Delete a review
router.delete("/:id", auth, async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId, // Ensure the user can only delete their own review
    });

    if (!review) return res.status(404).json({ error: "Review not found" });

    // Update the product's average rating
    await updateProductRating(review.productId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// Get average rating for a product
router.get("/product/:productId/average-rating", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length || 0;

    res.json({ averageRating });
  } catch (error) {
    console.error("Error fetching average rating:", error);
    res.status(500).json({ error: "Failed to fetch average rating" });
  }
});

module.exports = router;
