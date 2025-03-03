const express = require("express");
const { BlogPost } = require("../models/blogPost");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const router = express.Router();

// Get all blog posts (admin only)
router.get("/blog-posts", auth, isAdmin, async (req, res) => {
  try {
    const blogPosts = await BlogPost.find().lean();
    res.json(blogPosts);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// Delete a blog post (admin only)
router.delete("/blog-posts/:id", auth, isAdmin, async (req, res) => {
  try {
    const blogPost = await BlogPost.findByIdAndDelete(req.params.id);
    if (!blogPost)
      return res.status(404).json({ error: "Blog post not found" });
    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({ error: "Failed to delete blog post" });
  }
});

module.exports = router;
