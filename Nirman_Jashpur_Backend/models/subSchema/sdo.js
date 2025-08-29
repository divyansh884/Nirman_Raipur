import mongoose from "mongoose";

const sdoSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }
});

export default mongoose.model("SDO", sdoSchema);
