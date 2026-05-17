import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            match: [/^01[0-2,5]{1}[0-9]{8}$/, "Invalid Egyptian phone number"]
        },

        email: {
            type: String,
            unique: true,
            sparse: true, // 🔥 مهم جدًا علشان optional
            lowercase: true,
            trim: true,
            match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "Invalid email"]
        },

        password: {
            type: String,
            required: true,
            minlength: [8, "Password must be at least 8 characters long"],
            select: false
        },
        gender: {
            type: String,
            enum: ["male", "female", null],
            default: null
        },
        addresses: [
            {
                label: { type: String, enum: ["home", "work", "other"], default: "home" },
                city: { type: String, required: true },
                street: { type: String, required: true },
                building: String,
                notes: String,
                phoneNumber: {
                    type: String,
                    required: true,
                    match: [/^01[0125][0-9]{8}$/, "Invalid phone number"]
                },
                isDefault: { type: Boolean, default: false }

            }
        ],

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        isBlocked: {
            type: Boolean,
            default: false,
            select: false
        },
        isDeleted: {
            type: Boolean,
            default: false,
            select: false
        },

    },
    { timestamps: true }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.correctPassword = async function (inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
};
export default mongoose.model("User", userSchema);
