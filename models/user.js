const mongoose = require("mongoose");
const Joi = require("joi");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "distributor", "admin"],
    default: "user",
  },
  referralCode: { type: String, unique: true, default: null }, // 🚀 Default to null
  referredBy: { type: String, default: null }, // 🚀 Default to null
  referralRewards: { type: Number, default: 0 },
  withdrawableBalance: { type: Number, default: 0 },
  cart: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1, min: 1 },
    },
  ],
  loyaltyPoints: { type: Number, default: 0 },
  savedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("user", "distributor", "admin"),
    referralCode: Joi.string().optional(),
  });
  return schema.validate(user);
}

module.exports = { User, validateUser };
