const express = require("express");
const { Contact, validateContact } = require("../models/contact");
const sendEmail = require("../utils/email");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// ✅ Rate Limiting to Prevent Spam
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 submissions per 10 minutes
  message: "Too many contact requests, please try again later.",
});

// ✅ Submit a Contact Form
router.post("/", contactLimiter, async (req, res) => {
  const { error } = validateContact(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const contact = new Contact({
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
      createdAt: new Date(), // ✅ Save timestamp for records
    });

    await contact.save();

    // ✅ Send confirmation email
    const subject = "Thank You for Contacting Us!";
    const text = `Hi ${req.body.name},\n\nWe have received your message and will get back to you soon.\n\nMessage: ${req.body.message}`;
    await sendEmail(req.body.email, subject, text);

    res.status(201).json({ message: "Contact form submitted successfully" });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({ error: "Failed to submit contact form" });
  }
});

module.exports = router;
