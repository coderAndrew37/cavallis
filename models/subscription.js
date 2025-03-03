const mongoose = require("mongoose");
const Joi = require("joi");

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  frequency: {
    type: String,
    enum: ["monthly", "quarterly", "yearly"],
    required: true,
  },
  nextDeliveryDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["active", "paused", "cancelled"],
    default: "active",
  },
  createdAt: { type: Date, default: Date.now },
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

// Validation for subscription creation
function validateSubscription(subscription) {
  const schema = Joi.object({
    userId: Joi.string().required(),
    productId: Joi.string().required(),
    frequency: Joi.string().valid("monthly", "quarterly", "yearly").required(),
    nextDeliveryDate: Joi.date().required(),
  });
  return schema.validate(subscription);
}

module.exports = { Subscription, validateSubscription };
// In the subscription model, we define a schema for subscription documents. Each subscription has a userId, productId, frequency, nextDeliveryDate, status, and createdAt fields. The status field is an enum with possible values of "active", "paused", or "cancelled". The createdAt field is set to the current date and time by default.
