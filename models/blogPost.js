const commentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // User's name for the comment
  comment: { type: String, maxlength: 500 },
  isApproved: { type: Boolean, default: false }, // Admin approval
  createdAt: { type: Date, default: Date.now },
});

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  category: {
    type: String,
    enum: ["Health", "Nutrition", "Recipes"],
    required: true,
  },
  comments: [commentSchema], // Array of comments
  createdAt: { type: Date, default: Date.now },
});

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

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

// Validation for comment creation
function validateComment(comment) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(), // User's name for the comment
    comment: Joi.string().min(1).max(500).required(),
  });
  return schema.validate(comment);
}

module.exports = { BlogPost, validateBlogPost, validateComment };
