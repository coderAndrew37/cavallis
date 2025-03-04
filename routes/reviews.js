const express = require("express");
const { Review, validateReview } = require("../models/review");
const { Product } = require("../models/product");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const upload = require("../utils/upload"); // Import multer config
const router = express.Router();

// ✅ Create a Review (Requires Authentication)
router.post("/", auth, upload.single("image"), async (req, res) => {
  const { error } = validateReview(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    // Validate if the product exists
    if (req.body.productId) {
      const product = await Product.findById(req.body.productId);
      if (!product) return res.status(404).json({ error: "Product not found" });
    }

    const review = new Review({
      userId: req.user.userId,
      productId: req.body.productId || null,
      name: req.body.name,
      rating: req.body.rating,
      comment: req.body.comment,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      isApproved: false, // Pending Admin Approval
    });

    await review.save();
    res
      .status(201)
      .json({ message: "Review submitted! Pending admin approval.", review });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// ✅ Get All Approved Reviews
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const reviews = await Review.find({ isApproved: true })
      .sort({ rating: -1, likes: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Append full image URL
    reviews.forEach((review) => {
      if (review.image) {
        review.image = `${process.env.BACKEND_URL || "http://localhost:4000"}${
          review.image
        }`;
      }
    });

    const totalReviews = await Review.countDocuments({ isApproved: true });
    const totalPages = Math.ceil(totalReviews / limit);

    res.json({ reviews, currentPage: page, totalPages, totalReviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// ✅ Like a Review (User Only)
router.post("/:id/like", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    review.likes += 1;
    await review.save();

    res.json({ message: "Review liked successfully", likes: review.likes });
  } catch (error) {
    console.error("Error liking review:", error);
    res.status(500).json({ error: "Failed to like review" });
  }
});

// ✅ Approve a Review (Admin Only)
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
