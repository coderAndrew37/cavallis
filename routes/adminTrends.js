const express = require("express");
const { Order } = require("../models/order");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const router = express.Router();

// Get sales trends over time (admin only)
router.get("/sales-trends", auth, isAdmin, async (req, res) => {
  try {
    const salesTrends = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalSales: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(salesTrends);
  } catch (error) {
    console.error("Error fetching sales trends:", error);
    res.status(500).json({ error: "Failed to fetch sales trends" });
  }
});

// Get top-selling products (admin only)
router.get("/top-products", auth, isAdmin, async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    res.json(topProducts);
  } catch (error) {
    console.error("Error fetching top products:", error);
    res.status(500).json({ error: "Failed to fetch top products" });
  }
});

module.exports = router;
