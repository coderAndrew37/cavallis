const mongoose = require("mongoose");
const Joi = require("joi");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: {
    type: String,
    enum: ["Detox", "Weight Loss", "Women’s Health", "Other"],
    required: true,
  },
  benefits: [String],
  ingredients: [String],
  images: [String],
  stock: { type: Number, default: 0 },
  isBestseller: { type: Boolean, default: false },
  discountBadge: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);

// Validation for product creation
function validateProduct(product) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).required(),
    price: Joi.number().min(0).required(),
    category: Joi.string()
      .valid("Detox", "Weight Loss", "Women’s Health", "Other")
      .required(),
    benefits: Joi.array().items(Joi.string()),
    ingredients: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string()),
    stock: Joi.number().min(0),
    isBestseller: Joi.boolean(),
    discountBadge: Joi.string(),
  });
  return schema.validate(product);
}

module.exports = { Product, validateProduct };
