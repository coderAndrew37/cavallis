const express = require("express");
const axios = require("axios");
const Joi = require("joi");
const { Product } = require("../models/product");
const { Order } = require("../models/order");
const { User } = require("../models/user");
const { Chart } = require("../models/chart");

const router = express.Router();

// 🛠 Validate input with Joi
const schema = Joi.object({
  inputs: Joi.string().min(1).required(), // User message
  userId: Joi.string().allow(null, ""), // Optional user ID
});

router.post("/", async (req, res) => {
  console.log("🔹 Received Request:", req.body); // Log incoming request

  // Validate input
  const { error } = schema.validate(req.body);
  if (error) {
    console.log("❌ Validation Error:", error.details);
    return res.status(400).json({ reply: "Invalid input format." });
  }

  const { inputs: message, userId } = req.body;

  try {
    // 1. Check for product-related queries
    if (
      message.toLowerCase().includes("product") ||
      message.toLowerCase().includes("buy")
    ) {
      console.log("🔍 Searching for product:", message);
      const product = await Product.findOne({ name: new RegExp(message, "i") });
      console.log("🛍 Product Found:", product);

      if (product) {
        return res.json({
          reply: `Yes! We have ${product.name}. It costs Ksh ${product.price}. Would you like to buy it?`,
        });
      } else {
        // Improved response for no product found
        const similarProducts = await Product.find().limit(2); // Fetch 2 random products
        const productList = similarProducts.map((p) => p.name).join(" or ");
        return res.json({
          reply: `Sorry, we don't have that product in stock. You might like ${productList}. Browse more products here: [link].`,
        });
      }
    }

    // 2. Check for order-related queries
    if (
      userId &&
      (message.toLowerCase().includes("order") ||
        message.toLowerCase().includes("status"))
    ) {
      console.log("🔍 Checking order for user:", userId);
      const order = await Order.findOne({ userId }).sort({ createdAt: -1 });
      console.log("📦 Order Found:", order);

      if (order) {
        return res.json({
          reply: `Your last order status is: ${order.status}. Need help? Contact support.`,
        });
      } else {
        // Improved response for no orders found
        return res.json({
          reply:
            "No orders found for your account. Would you like to place a new order? Visit [link] to get started.",
        });
      }
    }

    // 3. Check for account-related queries
    if (userId && message.toLowerCase().includes("account")) {
      console.log("🔍 Checking user info for:", userId);
      const user = await User.findById(userId);
      console.log("👤 User Found:", user);

      if (user) {
        return res.json({
          reply: `You are logged in as ${user.name}. Need assistance? Contact support.`,
        });
      } else {
        // Improved response for user not found
        return res.json({
          reply:
            "User not found. Please log in or create an account to access your details.",
        });
      }
    }

    // 4. Check for chart-related queries
    if (
      message.toLowerCase().includes("chart") ||
      message.toLowerCase().includes("trends")
    ) {
      console.log("📊 Fetching latest chart data...");
      const chartData = await Chart.find().sort({ createdAt: -1 }).limit(5);
      console.log("📈 Chart Data:", chartData);

      if (chartData.length > 0) {
        const formattedData = chartData
          .map(
            (chart) =>
              `${chart.title}: ${chart.data
                .map((d) => `${d.label} (${d.value})`)
                .join(", ")}`
          )
          .join("\n");

        return res.json({
          reply: `Here are the latest stats:\n${formattedData}`,
        });
      } else {
        // Improved response for no chart data
        return res.json({
          reply:
            "No chart data is available at the moment. Please check back later for updates.",
        });
      }
    }

    // 5. Fallback to DeepSeek for store-related queries only
    console.log("🧠 No database match, falling back to AI...");
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are an online store assistant. If the question is not related to our store, reply: 'I only provide store-related information.'",
          },
          { role: "user", content: message },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` } }
    );

    console.log("🤖 AI Response:", response.data);

    if (response.data.choices && response.data.choices.length > 0) {
      return res.json({ reply: response.data.choices[0].message.content });
    } else {
      throw new Error("No valid response from DeepSeek API");
    }
  } catch (error) {
    console.error("❌ Chatbot error:", error);
    return res.json({
      reply: "I couldn't process your request. Please contact support.",
    });
  }
});

module.exports = router;
