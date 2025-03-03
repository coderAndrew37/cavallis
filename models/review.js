const mongoose = require("mongoose");
const Joi = require("joi");

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model("Review", reviewSchema);

// Indexing for faster retrieval
reviewSchema.index({ productId: 1 }); // Index for product ID
reviewSchema.index({ userId: 1 }); // Index for user ID

// Validation for review creation
function validateReview(review) {
  const schema = Joi.object({
    userId: Joi.string().required(),
    productId: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(500),
  });
  return schema.validate(review);
}

module.exports = { Review, validateReview };
