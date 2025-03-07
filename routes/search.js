const express = require("express");
const { Product } = require("../models/product");
const { Blog } = require("../models/blog");
const { FAQ } = require("../models/faq");
const { Testimonial } = require("../models/testimonial");

const router = express.Router();

// 🔍 Search API - Finds Products, Blog Posts, FAQs, and Testimonials
router.get("/", async (req, res) => {
  const query = req.query.q?.trim() || "";
  if (!query) return res.status(400).json({ error: "Search query required" });

  try {
    // 🔹 Search Products (by name & keywords)
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { keywords: { $regex: query, $options: "i" } },
      ],
    }).select("name price category image");

    // 🔹 Search Blog Posts (by title & content)
    const blogs = await Blog.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
      ],
    }).select("title excerpt");

    // 🔹 Search FAQs (by question)
    const faqs = await FAQ.find({
      question: { $regex: query, $options: "i" },
    }).select("question answer");

    // 🔹 Search Testimonials (by customer name & comment)
    const testimonials = await Testimonial.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { comment: { $regex: query, $options: "i" } },
      ],
    }).select("name comment");

    res.json({
      results: { products, blogs, faqs, testimonials },
    });
  } catch (error) {
    console.error("Error searching:", error);
    res.status(500).json({ error: "Failed to search" });
  }
});

module.exports = router;
