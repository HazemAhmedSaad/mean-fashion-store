import cors from "cors";
import AppError from "../utils/appError.js";

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS
        .split(",")
        .map(origin => origin.trim())
    : [];

const corsOptions = {

    origin(origin, callback) {

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(
                new AppError(
                    `CORS blocked for origin: ${origin}`,
                    403
                )
            );      
        }
    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ]

};

export default cors(corsOptions);