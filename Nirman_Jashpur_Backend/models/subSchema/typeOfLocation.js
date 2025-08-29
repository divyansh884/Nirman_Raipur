import mongoose from "mongoose";

const typeOfLocationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }
});

export default mongoose.model("TypeOfLocation", typeOfLocationSchema);
