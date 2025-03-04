const mongoose = require("mongoose");
const Joi = require("joi");

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 500, required: true },
  image: { type: String },
  isApproved: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model("Review", reviewSchema);

// ✅ Joi Validation for Review Submission
function validateReview(review) {
  const schema = Joi.object({
    productId: Joi.string().optional(),
    name: Joi.string().min(3).max(50).required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(500).required(),
    image: Joi.string().optional(),
  });
  return schema.validate(review);
}

module.exports = { Review, validateReview };
