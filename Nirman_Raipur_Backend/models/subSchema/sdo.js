const mongoose = require("mongoose");

const sdoSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
});

module.exports = mongoose.model('SDO', sdoSchema); 
