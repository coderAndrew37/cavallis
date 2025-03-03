const express = require("express");
const {
  Subscription,
  validateSubscription,
} = require("../models/subscription");
const { Product } = require("../models/product");
const auth = require("../middleware/auth");
const router = express.Router();

// Create a subscription
router.post("/", auth, async (req, res) => {
  const { error } = validateSubscription(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    // Check if the product exists
    const product = await Product.findById(req.body.productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Calculate the next delivery date based on frequency
    const nextDeliveryDate = calculateNextDeliveryDate(req.body.frequency);

    // Create the subscription
    const subscription = new Subscription({
      userId: req.user.userId,
      productId: req.body.productId,
      frequency: req.body.frequency,
      nextDeliveryDate,
    });

    await subscription.save();
    res.status(201).json(subscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

// Helper function to calculate the next delivery date
function calculateNextDeliveryDate(frequency) {
  const today = new Date();
  switch (frequency) {
    case "monthly":
      return new Date(today.setMonth(today.getMonth() + 1));
    case "quarterly":
      return new Date(today.setMonth(today.getMonth() + 3));
    case "yearly":
      return new Date(today.setFullYear(today.getFullYear() + 1));
    default:
      throw new Error("Invalid frequency");
  }
}

// Get all subscriptions for a user
router.get("/user", auth, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const subscriptions = await Subscription.find({ userId: req.user.userId })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalSubscriptions = await Subscription.countDocuments({
      userId: req.user.userId,
    });
    const totalPages = Math.ceil(totalSubscriptions / limit);

    res.json({
      subscriptions,
      currentPage: page,
      totalPages,
      totalSubscriptions,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

// Update a subscription
router.put("/:id", auth, async (req, res) => {
  const { error } = validateSubscription(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId }, // Ensure the user can only update their own subscription
      {
        frequency: req.body.frequency,
        nextDeliveryDate: calculateNextDeliveryDate(req.body.frequency),
      },
      { new: true }
    );

    if (!subscription)
      return res.status(404).json({ error: "Subscription not found" });

    res.json(subscription);
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

// Cancel a subscription
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId }, // Ensure the user can only cancel their own subscription
      { status: "cancelled" },
      { new: true }
    );

    if (!subscription)
      return res.status(404).json({ error: "Subscription not found" });

    res.json({ message: "Subscription cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// Get subscription by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user.userId, // Ensure the user can only fetch their own subscription
    }).lean();

    if (!subscription)
      return res.status(404).json({ error: "Subscription not found" });

    res.json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

module.exports = router;
