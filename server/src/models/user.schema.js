import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        phone: { type: [String], required: true, unique: true },
        addresses: [
            {
                label: String, // home, work
                city: String,
                street: String,
                building: String,
                notes: String,

                isDefault: {
                    type: Boolean,
                    default: false
                }
            }
        ],
        email: { type: String, unique: true },
        password: { type: String, required: true, select: false },
        gender: { type: String, enum: ["male", "female"], default: "male" },
        isActive: { type: Boolean, default: false },
        role: { type: String, enum: ["user", "admin"], default: "user" },
    },
    { timestamps: true },
);
userSchema.pre("save", async function (next) {
    try {
        if (this.isModified("password")) {
            this.password = await bcrypt.hash(this.password, 12);
        }
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.correctPassword = async function (inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
};
export default mongoose.model("User", userSchema);