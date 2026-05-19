import mongoose from "mongoose";
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1, min: 1 },
        priceAtAddition: { type: Number }, // السعر المسجل لحظة وضع المنتج في العربة[cite: 1]
        isPriceChanged: { type: Boolean, default: false } // فلاج للتنبيه في الـ UI[cite: 1]
    }],
    totalPrice: { type: Number, default: 0 }
}, { timestamps: true, versionKey: false });

export default mongoose.model("Cart", cartSchema);