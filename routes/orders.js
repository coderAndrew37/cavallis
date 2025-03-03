const express = require("express");
const { Order, validateOrder } = require("../models/order");
const { Product } = require("../models/product");
const auth = require("../middleware/auth");
const router = express.Router();

// Create an order
router.post("/", auth, async (req, res) => {
  const { error } = validateOrder(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    // Fetch product details for each item in the order
    const items = await Promise.all(
      req.body.items.map(async (item) => {
        const product = await Product.findById(item.productId).lean();
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        return {
          productId: item.productId,
          name: product.name,
          quantity: item.quantity,
          price: product.price,
        };
      })
    );

    // Calculate total amount
    const totalAmount = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Create the order
    const order = new Order({
      userId: req.user.userId,
      items,
      totalAmount,
      paymentMethod: req.body.paymentMethod,
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Get all orders with pagination and filtering
router.get("/", auth, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const status = req.query.status; // Optional status filter

  // Build filter
  const filter = {};
  if (status) filter.status = status;

  try {
    const orders = await Order.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders,
      currentPage: page,
      totalPages,
      totalOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Update order status
router.patch("/:id/status", auth, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required" });

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Delete an order
router.delete("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// Get orders by user ID
router.get("/user/:userId", auth, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const orders = await Order.find({ userId: req.params.userId })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalOrders = await Order.countDocuments({
      userId: req.params.userId,
    });
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders,
      currentPage: page,
      totalPages,
      totalOrders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
});

module.exports = router;
