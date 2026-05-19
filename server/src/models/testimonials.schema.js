import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
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
            default: 5
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
