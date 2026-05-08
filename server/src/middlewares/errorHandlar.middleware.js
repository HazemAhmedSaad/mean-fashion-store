const errorHandler = (err, req, res, next) => {

    let statusCode = err.statusCode || 500;
    let status = err.status || "error";
    let message = err.message || "Server Error";

    // Invalid MongoDB ObjectId
    if (err.name === "CastError") {
        statusCode = 400;
        status = "fail";
        message = "Invalid ID";
    }

    // Duplicate key
    if (err.code === 11000) {
        statusCode = 400;
        status = "fail";

        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists`;
    }

    // Validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        status = "fail";

        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
    }

    res.status(statusCode).json({
        success: false,
        status,
        message,
        stack:
            process.env.NODE_ENV === "development"
                ? err.stack
                : undefined,
    });
};

export default errorHandler;