import mongoose from "mongoose";
const subCategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, select: false },
  },
  {
    versionKey: false, // يخفي __v
  },
  { timestamps: true },
);

export default mongoose.model("SubCategory", subCategorySchema);
