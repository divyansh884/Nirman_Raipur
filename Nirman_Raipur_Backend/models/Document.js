const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    storageClass: {
      type: String,
      default: "STANDARD",
    },
    eTag: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)


module.exports = {documentModel: mongoose.model('Document', documentSchema), documentSchema};
