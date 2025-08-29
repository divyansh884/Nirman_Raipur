import mongoose from "mongoose";

const wardSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }
});

export default mongoose.model("Ward", wardSchema);
