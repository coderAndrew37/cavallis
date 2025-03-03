const mongoose = require("mongoose");
const Joi = require("joi");

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  category: {
    type: String,
    enum: ["Health", "Nutrition", "Recipes"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

// Indexing for performance optimization
blogPostSchema.index({ author: 1 }); // Index for author
blogPostSchema.index({ category: 1 }); // Index for category

// Validation for blog post creation
function validateBlogPost(blogPost) {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    content: Joi.string().min(10).required(),
    author: Joi.string().min(3).max(50).required(),
    category: Joi.string().valid("Health", "Nutrition", "Recipes").required(),
  });
  return schema.validate(blogPost);
}

module.exports = { BlogPost, validateBlogPost };
// In the blogPost.js file, we define a Mongoose schema for a blog post. The schema includes fields like title, content, author, category, and createdAt. The BlogPost model is created using this schema.
// We also define a validation function validateBlogPost using Joi for blog post creation.
// This module exports the BlogPost model and the validateBlogPost function.
// The code snippets for the other models (review.js, distributor.js, user.js, product.js) follow a similar structure. Each file defines a Mongoose schema, a model, and a validation function using Joi.
