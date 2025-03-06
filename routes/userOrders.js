const express = require("express");
const { Order, validateOrder } = require("../models/order");
const { Product } = require("../models/product");
const auth = require("../middleware/auth");
const sendEmail = require("../utils/email");
const router = express.Router();

// Create an order (user only)
router.post("/", auth, async (req, res) => {
  const { error } = validateOrder(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
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

    const totalAmount = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const order = new Order({
      userId: req.user.userId,
      items,
      totalAmount,
      paymentMethod: req.body.paymentMethod,
    });

    await order.save();

    // ✅ Reward the Referrer (if applicable)
    const user = await User.findById(req.user.userId);
    if (user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy });
      if (referrer) {
        const rewardAmount = totalAmount * 0.1;
        referrer.referralRewards += rewardAmount;
        referrer.withdrawableBalance += rewardAmount;
        await referrer.save();
      }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Get orders for the current user (user only)
router.get("/", auth, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const orders = await Order.find({ userId: req.user.userId })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalOrders = await Order.countDocuments({ userId: req.user.userId });
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

// Get a specific order by ID (user only)
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.userId, // Ensure the user can only access their own orders
    }).lean();

    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

module.exports = router;
