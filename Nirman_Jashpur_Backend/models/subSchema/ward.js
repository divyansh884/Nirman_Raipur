const mongoose = require("mongoose");

const wardSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
});

module.exports = {
  Scheme: mongoose.model("Ward", wardSchema),
};
