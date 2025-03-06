const mongoose = require("mongoose");

const chartSchema = new mongoose.Schema({
  title: { type: String, required: true },
  data: { type: Array, required: true }, // Array of { label: String, value: Number }
  description: { type: String, required: false }, // Optional description
  createdAt: { type: Date, default: Date.now },
});

const Chart = mongoose.model("Chart", chartSchema);
module.exports = { Chart };
