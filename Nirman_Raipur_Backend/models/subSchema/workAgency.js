const mongoose = require('mongoose');

const workAgencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
});


module.exports = mongoose.model('WorkAgency', workAgencySchema);


