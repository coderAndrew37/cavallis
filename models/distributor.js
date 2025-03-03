const mongoose = require("mongoose");
const Joi = require("joi");

const distributorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  businessName: { type: String, required: true },
  contactInfo: {
    phone: { type: String, required: true },
    address: { type: String, required: true },
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const Distributor = mongoose.model("Distributor", distributorSchema);

// Validation for distributor sign-up
function validateDistributor(distributor) {
  const schema = Joi.object({
    userId: Joi.string().required(),
    businessName: Joi.string().min(3).max(100).required(),
    contactInfo: Joi.object({
      phone: Joi.string().required(),
      address: Joi.string().required(),
    }).required(),
  });
  return schema.validate(distributor);
}

module.exports = { Distributor, validateDistributor };
