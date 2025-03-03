const express = require("express");
const { Product, validateProduct } = require("../models/product");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const router = express.Router();

// Get all products with pagination, filtering, and sorting
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const category = req.query.category;
  const sort = req.query.sort; // e.g., "price-asc", "price-desc", "rating"

  // Build filter
  const filter = {};
  if (category) filter.category = category;

  // Build sort
  const sortOptions = {};
  if (sort === "price-asc") sortOptions.price = 1;
  if (sort === "price-desc") sortOptions.price = -1;
  if (sort === "rating") sortOptions.rating = -1;

  try {
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      products,
      currentPage: page,
      totalPages,
      totalProducts,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create a new product
router.post("/", auth, isAdmin, async (req, res) => {
  const { error } = validateProduct(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update a product
router.put("/:id", auth, isAdmin, async (req, res) => {
  const { error } = validateProduct(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete a product
router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Search products by name, category, or keywords
router.get("/search", async (req, res) => {
  const query = req.query.q || "";
  const category = req.query.category;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  // Build filter
  const filter = {
    $or: [
      { name: { $regex: query, $options: "i" } },
      { keywords: { $regex: query, $options: "i" } },
    ],
  };
  if (category) filter.category = category;

  try {
    const products = await Product.find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      products,
      currentPage: page,
      totalPages,
      totalProducts,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

// Get product suggestions for typeahead search
router.get("/suggestions", async (req, res) => {
  const query = req.query.q || "";

  try {
    const suggestions = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { keywords: { $regex: query, $options: "i" } },
      ],
    })
      .limit(5)
      .select("name");

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

module.exports = router;

/**
 * @api {get} /api/products Get all products
 * @apiName GetProducts
 * @apiGroup Products
 *
 * @apiParam {Number} [page=1] Page number
 * @apiParam {Number} [limit=10] Number of products to return per page
 * @apiParam {String} [category] Product category
 * @apiParam {String} [sort] Sort products by price (asc/desc) or rating (desc)
 *
 * @apiSuccess {Object[]} products Array of products
 * @apiSuccess {Number} currentPage Current page number
 * @apiSuccess {Number} totalPages Total number of pages
 * @apiSuccess {Number} totalProducts Total number of products
 */
