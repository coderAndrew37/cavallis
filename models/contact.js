const mongoose = require("mongoose");
const Joi = require("joi");

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model("Contact", contactSchema);

//validate using joi
function validateContact(contact) {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    message: Joi.string().required(),
  });

  return schema.validate(contact);
}

module.exports = { Contact, validateContact };
