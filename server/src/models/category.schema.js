import mongoose from "mongoose";
const categorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, select: false },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export default mongoose.model("Category", categorySchema);
