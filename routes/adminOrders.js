const express = require("express");
const { Order } = require("../models/order");
const { User } = require("../models/user");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const sendEmail = require("../utils/email");
const router = express.Router();

// Get all orders (admin only)
router.get("/", auth, isAdmin, async (req, res) => {
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

// Get order by ID (admin only)
router.get("/:id", auth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Update order status (admin only)
router.patch("/:id/status", auth, isAdmin, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required" });

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Fetch the user's email
    const user = await User.findById(order.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Send email to the user
    const subject = "Your Order Status Has Been Updated";
    const text = `Hi ${user.name},\n\nThe status of your order (ID: ${order._id}) has been updated to: ${status}.\n\nThank you for shopping with us!`;
    await sendEmail(user.email, subject, text);

    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Delete an order (admin only)
router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// Get orders by user ID (admin only)
router.get("/user/:userId", auth, isAdmin, async (req, res) => {
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
