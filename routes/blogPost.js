const express = require("express");
const {
  BlogPost,
  validateBlogPost,
  validateComment,
} = require("../models/blogPost");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const router = express.Router();

// Helper function for handling errors
const handleError = (res, error, defaultMessage) => {
  console.error(error);
  res.status(500).json({ error: defaultMessage });
};

// Create a blog post
router.post("/", auth, async (req, res) => {
  const { error } = validateBlogPost(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const isAdmin = req.user.role === "admin";

    const blogPost = new BlogPost({
      title: req.body.title,
      content: req.body.content,
      author: req.user.userId, // Set the author to the logged-in user
      category: req.body.category,
      status: isAdmin ? "approved" : "pending", // ✅ Admins publish instantly, users require approval
    });

    await blogPost.save();
    res.status(201).json(blogPost);
  } catch (error) {
    res.status(500).json({ error: "Failed to create blog post" });
  }
});

// Get all blog posts with pagination and filtering
router.get("/", auth, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const category = req.query.category;
  const status =
    req.query.status || (req.user?.role === "admin" ? null : "approved"); // ✅ Default: Users only see approved blogs, admins see all

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;

  try {
    const blogPosts = await BlogPost.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalBlogPosts = await BlogPost.countDocuments(filter);
    const totalPages = Math.ceil(totalBlogPosts / limit);

    res.json({ blogPosts, currentPage: page, totalPages, totalBlogPosts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// Get a specific blog post
router.get("/:id", async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id).lean();
    if (!blogPost)
      return res.status(404).json({ error: "Blog post not found" });
    res.json(blogPost);
  } catch (error) {
    handleError(res, error, "Failed to fetch blog post");
  }
});

// Users can only edit pending blogs, admins can edit anything
router.put("/:id", auth, async (req, res) => {
  const { error } = validateBlogPost(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const filter =
      req.user.role === "admin"
        ? { _id: req.params.id } // ✅ Admins can edit any blog
        : { _id: req.params.id, author: req.user.userId, status: "pending" }; // ✅ Users can only edit pending blogs

    const blogPost = await BlogPost.findOneAndUpdate(
      filter,
      {
        title: req.body.title,
        content: req.body.content,
        category: req.body.category,
      },
      { new: true }
    );

    if (!blogPost)
      return res
        .status(404)
        .json({ error: "Blog post not found or cannot be edited" });

    res.json(blogPost);
  } catch (error) {
    res.status(500).json({ error: "Failed to update blog post" });
  }
});

// ✅ Approve a blog post (admin only)
router.patch("/:id/approve", auth, isAdmin, async (req, res) => {
  try {
    const blogPost = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    if (!blogPost)
      return res.status(404).json({ error: "Blog post not found" });

    // 🔹 Fetch user and send notification
    const user = await User.findById(blogPost.author);
    if (user) {
      user.notifications.push({
        message: `Your blog post "${blogPost.title}" has been approved! 🎉`,
        read: false,
      });
      await user.save();
    }

    res.json({ message: "Blog post approved successfully", blogPost });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve blog post" });
  }
});

// Delete a blog post (admin can delete any, users can delete pending)
router.delete("/:id", auth, async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? { _id: req.params.id } // ✅ Admins can delete any blog
        : { _id: req.params.id, author: req.user.userId, status: "pending" }; // ✅ Users can only delete pending blogs

    const blogPost = await BlogPost.findOneAndDelete(filter);

    if (!blogPost)
      return res
        .status(404)
        .json({ error: "Blog post not found or not deletable" });

    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete blog post" });
  }
});

// Add a comment to a blog post
router.post("/:id/comments", async (req, res) => {
  const { error } = validateComment(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

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
    handleError(res, error, "Failed to add comment");
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
    handleError(res, error, "Failed to fetch comments");
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
      handleError(res, error, "Failed to approve comment");
    }
  }
);

module.exports = router;
