const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional for general reviews
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // Optional for general reviews
  name: { type: String, required: true }, // User's name for general reviews
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 500 },
  image: { type: String }, // URL for the uploaded image
  isApproved: { type: Boolean, default: false }, // Admin approval
  likes: { type: Number, default: 0 }, // Number of likes
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model("Review", reviewSchema);

// Validation for review creation
function validateReview(review) {
  const schema = Joi.object({
    userId: Joi.string().optional(), // Optional for general reviews
    productId: Joi.string().optional(), // Optional for general reviews
    name: Joi.string().min(3).max(50).required(), // User's name for general reviews
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(500).required(),
    image: Joi.string().optional(), // Optional image URL
  });
  return schema.validate(review);
}

module.exports = { Review, validateReview };
