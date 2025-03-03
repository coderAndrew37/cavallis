const mongoose = require("mongoose");
const Joi = require("joi");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
  paymentMethod: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

// Indexes for faster queries
orderSchema.index({ userId: 1 }); // Index for user ID
orderSchema.index({ status: 1 }); // Index for status

// Validation for order creation
function validateOrder(order) {
  const schema = Joi.object({
    userId: Joi.string().required(),
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().required(),
          quantity: Joi.number().min(1).required(),
          price: Joi.number().min(0).required(),
        })
      )
      .min(1)
      .required(),
    totalAmount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().required(),
  });
  return schema.validate(order);
}

module.exports = { Order, validateOrder };
