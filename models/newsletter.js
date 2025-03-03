const mongoose = require("mongoose");
const Joi = require("joi");

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now },
});

const Newsletter = mongoose.model("Newsletter", newsletterSchema);

//validate using joi

function validateNewsletter(newsletter) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });

  return schema.validate(newsletter);
}

module.exports = { Newsletter, validateNewsletter };
