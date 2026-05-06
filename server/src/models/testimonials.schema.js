import mongoose from "mongoose";
const testimonialSchema = new mongoose.Schema(
    {
        // لو المستخدم عامل login
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false
        },

        // لو Guest
        name: {
            type: String,
            required: function () {
                return !this.user; // مطلوب لو مفيش user
            },
            trim: true
        },

        phone: {
            type: String,
            required: function () {
                return !this.user;
            },
            match: [/^01[0-2,5]{1}[0-9]{8}$/, "Invalid Egyptian phone number"]
        },

        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },

        stars: {
            type: Number,
            min: 1,
            max: 5,
            default: 5 // ممكن تخليها optional
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },

        isVisible: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

export default mongoose.model("Testimonial", testimonialSchema);