const mongoose = require('mongoose');

// Type of Work Schema
const typeOfWorkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
});

module.exports = {
  TypeOfWork: mongoose.model('TypeOfWork', typeOfWorkSchema)
};