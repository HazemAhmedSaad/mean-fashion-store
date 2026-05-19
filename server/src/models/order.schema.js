import mongoose from "mongoose";
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number },
        priceAtOrderTime: { type: Number }, // لضمان عدم تغير الحسابات المالية مستقبلاً[cite: 1]
      },
    ],
    shippingAddress: {
      // نسخة نصية ثابتة من العنوان وقت الطلب[cite: 1]
      addressText: String,
      phone: String,
    },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "preparing",
        "shipped",
        "delivered",
        "refused",
        "canceled_by_user",
        "canceled_by_admin",
      ],
      default: "pending",
    },
    orderDate: { type: Date, default: Date.now }, // مهم لتقارير المبيعات[cite: 1]
    isDeleted: { type: Boolean, default: false, select: false }, // للحذف المنطقي
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("Order", orderSchema);
