const express = require("express");
const { Newsletter, validateNewsletter } = require("../models/newsletter");
const sendEmail = require("../utils/email");
const router = express.Router();

// Subscribe to the newsletter
router.post("/", async (req, res) => {
  const { error } = validateNewsletter(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    // Check if the email is already subscribed
    const existingSubscriber = await Newsletter.findOne({
      email: req.body.email,
    });
    if (existingSubscriber) {
      return res.status(400).json({ message: "Email already subscribed" });
    }

    const newsletter = new Newsletter({
      email: req.body.email,
    });

    await newsletter.save();

    // Send confirmation email
    const subject = "Welcome to Our Newsletter!";
    const text = `Thank you for subscribing to our newsletter, ${req.body.email}.`;
    await sendEmail(req.body.email, subject, text);

    res.status(201).json({ message: "Subscribed to newsletter successfully" });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    res.status(500).json({ error: "Failed to subscribe to newsletter" });
  }
});

module.exports = router;
