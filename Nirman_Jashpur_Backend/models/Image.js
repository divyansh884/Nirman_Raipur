const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    images: [
      {
        url: { type: String, required: true },
        key: { type: String, required: true },
        size: { type: Number, required: true },
        eTag: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = {
  imageModel: mongoose.model("Image", imageSchema),
  imageSchema,
};

