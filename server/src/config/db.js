import mongoose from "mongoose";
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1);
    }
};

export default connectDB;
