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
            select: false
        },
        passwordConfirm: {
            type: String,
            required: true,
            validate: {
                validator: function (el) {
                    return el === this.password;
                },
                message: "Passwords are not the same!"
            }
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
                    match: [/^01[0-2,5]{1}[0-9]{8}$/, "Invalid phone number"]
                }, isDefault: { type: Boolean, default: false }

            }
        ],

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);
userSchema.index({ phone: 1 });

userSchema.pre("save", async function (next) {
    try {
        if (this.isModified("password")) {
            this.password = await bcrypt.hash(this.password, 12);
            this.passwordConfirm = undefined;
        }
        next();
    } catch (err) {
        next(err);
    }
});
userSchema.index({ phone: 1 });

userSchema.methods.correctPassword = async function (inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
};
export default mongoose.model("User", userSchema);