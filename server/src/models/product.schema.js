import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    images: {
      type: [String],
      required: true,
      validate: [
        (val) => val.length > 0,
        "Product must have at least one image",
      ],
    },
    stock: { type: Number, required: true, default: 0 }, // إذا كان <= 3 يظهر تحذير
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    isActive: { type: Boolean, default: true }, // للمنتجات الموسمية
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// productSchema.pre("save", function () {
//   if (!this.isModified("name")) return;

//   this.slug = this.name
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-+|-+$/g, "");
// });

export default mongoose.model("Product", productSchema);
