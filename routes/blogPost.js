const express = require("express");
const {
  BlogPost,
  validateBlogPost,
  validateComment,
} = require("../models/blogPost");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const router = express.Router();

// Create a blog post
router.post("/", auth, async (req, res) => {
  const { error } = validateBlogPost(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const blogPost = new BlogPost({
      title: req.body.title,
      content: req.body.content,
      author: req.user.userId, // Set the author to the logged-in user
      category: req.body.category,
    });

    await blogPost.save();
    res.status(201).json(blogPost);
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(500).json({ error: "Failed to create blog post" });
  }
});

// Get all blog posts with pagination and filtering
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const category = req.query.category; // Optional category filter

  // Build filter
  const filter = {};
  if (category) filter.category = category;

  try {
    const blogPosts = await BlogPost.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalBlogPosts = await BlogPost.countDocuments(filter);
    const totalPages = Math.ceil(totalBlogPosts / limit);

    res.json({
      blogPosts,
      currentPage: page,
      totalPages,
      totalBlogPosts,
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// Get blog post by ID
router.get("/:id", async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id).lean();
    if (!blogPost)
      return res.status(404).json({ error: "Blog post not found" });
    res.json(blogPost);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

// Update a blog post
router.put("/:id", auth, isAdmin, async (req, res) => {
  const { error } = validateBlogPost(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const blogPost = await BlogPost.findOneAndUpdate(
      { _id: req.params.id, author: req.user.userId }, // Ensure the user can only update their own blog post
      {
        title: req.body.title,
        content: req.body.content,
        category: req.body.category,
      },
      { new: true }
    );

    if (!blogPost)
      return res.status(404).json({ error: "Blog post not found" });

    res.json(blogPost);
  } catch (error) {
    console.error("Error updating blog post:", error);
    res.status(500).json({ error: "Failed to update blog post" });
  }
});

// Delete a blog post
router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    const blogPost = await BlogPost.findOneAndDelete({
      _id: req.params.id,
      author: req.user.userId, // Ensure the user can only delete their own blog post
    });

    if (!blogPost)
      return res.status(404).json({ error: "Blog post not found" });

    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({ error: "Failed to delete blog post" });
  }
});

// Add a comment to a blog post
router.post("/:id/comments", async (req, res) => {
  const { error } = validateComment(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const blogPost = await BlogPost.findById(req.params.id);
    if (!blogPost)
      return res.status(404).json({ error: "Blog post not found" });

    // Add the comment (pending admin approval)
    blogPost.comments.push({
      name: req.body.name, // User's name for the comment
      comment: req.body.comment,
      isApproved: false,
    });

    await blogPost.save();
    res.status(201).json({ message: "Comment added successfully" });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Get all approved comments for a blog post
router.get("/:id/comments", async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id).select("comments");
    if (!blogPost)
      return res.status(404).json({ error: "Blog post not found" });

    // Filter approved comments
    const approvedComments = blogPost.comments.filter(
      (comment) => comment.isApproved
    );
    res.json(approvedComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Approve a comment (admin only)
router.patch(
  "/:id/comments/:commentId/approve",
  auth,
  isAdmin,
  async (req, res) => {
    try {
      const blogPost = await BlogPost.findById(req.params.id);
      if (!blogPost)
        return res.status(404).json({ error: "Blog post not found" });

      // Find and approve the comment
      const comment = blogPost.comments.id(req.params.commentId);
      if (!comment) return res.status(404).json({ error: "Comment not found" });

      comment.isApproved = true;
      await blogPost.save();

      res.json({ message: "Comment approved successfully", comment });
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(500).json({ error: "Failed to approve comment" });
    }
  }
);

module.exports = router;
// In this file, we define the routes for creating, reading, updating, and deleting blog posts. The routes are protected by the auth middleware, which ensures that only authenticated users can access them. We also use the validateBlogPost function from the blogPost model to validate the request body before creating or updating a blog post.
