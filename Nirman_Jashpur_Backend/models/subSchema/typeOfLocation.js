const mongoose = require("mongoose");

const typeOfLocationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
});

module.exports = {
  Scheme: mongoose.model('TypeOfLocation', typeOfLocationSchema)
};
