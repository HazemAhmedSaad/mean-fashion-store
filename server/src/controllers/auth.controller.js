import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.schema.js';
import AppError from '../utils/appError.js';

// وظيفة مساعدة لتوليد التوكن
const signToken = (user) => {
    return jwt.sign({
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
    }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// --- [ SIGNUP ] ---
export const signup = asyncHandler(async (req, res, next) => {

    const {
        name,
        phone,
        email,
        password
    } = req.body;

    if (!phone || !password || !name) {

        return next(
            new AppError(
                "Name, phone and password are required",
                400
            )
        );
    }

    const user = await User.create({
        name,
        phone,
        email,
        password
    });

    const token = signToken(user);

    res.status(201).json({
        success: true,
        token,
    });

});

// --- [ LOGIN ] ---
export const login = asyncHandler(async (req, res, next) => {

    const { phone, password } = req.body;

    if (!phone || !password) {
        return next(
            new AppError(
                "Please provide phone and password",
                400
            )
        );
    }

    const user = await User.findOne({ phone })
        .select("+password +isDeleted");

    // check user exists
    if (!user) {
        return next(
            new AppError(
                "Invalid phone or password",
                401
            )
        );
    }

    // check soft delete
    if (user.isDeleted) {
        return next(
            new AppError(
                "This account has been deleted",
                403
            )
        );
    }

    // check password
    const isCorrectPassword =
        await user.correctPassword(password, user.password);

    if (!isCorrectPassword) {
        return next(
            new AppError(
                "Invalid phone or password",
                401
            )
        );
    }

    const token = signToken(user);

    res.status(200).json({
        success: true,
        token,
    });

});