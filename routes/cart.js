const express = require("express");
const auth = require("../middleware/auth");
const { User } = require("../models/user");
const { Product } = require("../models/product");
const router = express.Router();

// Add item to cart
router.post("/", auth, async (req, res) => {
  const { productId, quantity } = req.body;

  // Validate input
  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Find the user and update their cart
    const user = await User.findById(req.user.userId);
    const cartItem = user.cart.find(
      (item) => item.productId.toString() === productId
    );

    if (cartItem) {
      // Update quantity if the item already exists in the cart
      cartItem.quantity += quantity;
    } else {
      // Add new item to the cart
      user.cart.push({ productId, quantity });
    }

    await user.save();
    res.json(user.cart);
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Failed to add item to cart" });
  }
});

// Remove item from cart
router.delete("/:cartItemId", auth, async (req, res) => {
  const { cartItemId } = req.params;

  try {
    // Find the user and remove the item from their cart
    const user = await User.findById(req.user.userId);
    user.cart = user.cart.filter((item) => item._id.toString() !== cartItemId);

    await user.save();
    res.json(user.cart);
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Failed to remove item from cart" });
  }
});

// Update item quantity in cart
router.patch("/:cartItemId", auth, async (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  // Validate input
  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: "Invalid quantity" });
  }

  try {
    // Find the user and update the item quantity in their cart
    const user = await User.findById(req.user.userId);
    const cartItem = user.cart.find(
      (item) => item._id.toString() === cartItemId
    );

    if (!cartItem)
      return res.status(404).json({ message: "Item not found in cart" });

    cartItem.quantity = quantity;
    await user.save();
    res.json(user.cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Failed to update item quantity" });
  }
});

// Get cart contents
router.get("/", auth, async (req, res) => {
  try {
    // Find the user and return their cart with product details
    const user = await User.findById(req.user.userId).populate(
      "cart.productId",
      "name price"
    );
    res.json(user.cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});

// Clear cart
router.delete("/", auth, async (req, res) => {
  try {
    // Find the user and clear their cart
    const user = await User.findById(req.user.userId);
    user.cart = [];
    await user.save();
    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

module.exports = router;
