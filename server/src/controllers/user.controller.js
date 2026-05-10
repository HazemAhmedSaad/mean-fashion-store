import User from "../models/user.schema.js";
import asyncHandler from './../utils/asyncHandler.js';
import AppError from './../utils/appError.js';
import APIFeatures from './../utils/apiFeatures.js';


// ======================================================
// Filter Allowed Fields Utility
// ======================================================


const filterObj = (obj, ...allowedFields) => {
    const newObj = {};

    Object.keys(obj).forEach((key) => {
        if (allowedFields.includes(key)) {
            newObj[key] = obj[key];
        }
    });
    return newObj;
};


// ======================================================
// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
// ======================================================

export const getMe = asyncHandler(async (req, res, next) => {

    const user = await User.findById(req.user._id);

    if (!user || user.isDeleted) {
        return next(new AppError("User not found", 404));
    }

    res.status(200).json({
        success: true,
        data: user
    });
});


// ======================================================
// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
// ======================================================

export const updateMe = asyncHandler(async (req, res, next) => {

    // Prevent password updates here
    if (req.body.password || req.body.newPassword) {
        return next(
            new AppError(
                "This route is not for password updates. Please use /change-password",
                400
            )
        );
    }

    // Filter allowed fields
    const filteredBody = filterObj(
        req.body,
        "name",
        "email",
        "phone",
        "gender"
    );

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        filteredBody,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        data: updatedUser
    });
});


// ======================================================
// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
// ======================================================

export const changePassword = asyncHandler(async (req, res, next) => {

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(
            new AppError("Please provide current password and new password", 400)
        );
    }

    const user = await User.findById(req.user._id)
        .select("+password");

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    // Check current password
    const isMatch = await user.correctPassword(currentPassword);

    if (!isMatch) {
        return next(
            new AppError("Current password is incorrect", 400)
        );
    }

    // Update password
    user.password = newPassword;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password updated successfully"
    });
});


// ======================================================
// @desc    Soft delete current user
// @route   DELETE /api/users/me
// @access  Private
// ======================================================

export const deleteMe = asyncHandler(async (req, res, next) => {

    await User.findByIdAndUpdate(req.user._id, {
        isDeleted: true
    });

    res.status(204).json({
        success: true,
        data: null
    });
});


// ======================================================
// @desc    Add address
// @route   POST /api/users/address
// @access  Private
// ======================================================

export const addAddress = asyncHandler(async (req, res, next) => {

    const {
        label,
        city,
        street,
        building,
        notes,
        phoneNumber,
        isDefault
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    // Remove old default
    if (isDefault) {
        user.addresses.forEach((address) => {
            address.isDefault = false;
        });
    }

    user.addresses.push({
        label,
        city,
        street,
        building,
        notes,
        phoneNumber,
        isDefault
    });

    await user.save();

    res.status(201).json({
        success: true,
        data: user.addresses
    });
});


// ======================================================
// @desc    update address
// @route   PUT /api/users/address
// @access  Private
// ======================================================

export const updateAddress = asyncHandler(async (req, res, next) => {

    const {
        label,
        city,
        street,
        building,
        notes,
        phoneNumber,
        isDefault
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    user.addresses.forEach((address) => {
        if (address._id.toString() === req.params.id) {
            address.label = label;
            address.city = city;
            address.street = street;
            address.building = building;
            address.notes = notes;
            address.phoneNumber = phoneNumber;
            address.isDefault = isDefault;
        }
    });

    await user.save();

    res.status(200).json({
        success: true,
        data: user.addresses
    })
});

    // ======================================================
    // @desc    Delete address
    // @route   DELETE /api/users/address/:id
    // @access  Private
    // ======================================================

    export const deleteAddress = asyncHandler(async (req, res, next) => {

        const user = await User.findById(req.user._id);

        if (!user) {
            return next(new AppError("User not found", 404));
        }

        user.addresses = user.addresses.filter(
            (address) => address._id.toString() !== req.params.id
        );

        await user.save();

        res.status(200).json({
            success: true,
            message: "Address deleted successfully",
            data: user.addresses
        });
    });


    // ======================================================
    // @desc    Get all users
    // @route   GET /api/users
    // @access  Admin
    // ======================================================

    export const getAllUsers = asyncHandler(async (req, res, next) => {

        const features = new APIFeatures(
            User.find({ isDeleted: false }),
            req.query
        )
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const users = await features.query;

        res.status(200).json({
            success: true,
            results: users.length,
            data: users
        });
    });


    // ======================================================
    // @desc    Get single user
    // @route   GET /api/users/:id
    // @access  Admin
    // ======================================================

    export const getUser = asyncHandler(async (req, res, next) => {

        const user = await User.findById(req.params.id);

        if (!user || user.isDeleted) {
            return next(new AppError("User not found", 404));
        }

        res.status(200).json({
            success: true,
            data: user
        });
    });


    // ======================================================
    // @desc    Update user by admin
    // @route   PUT /api/users/:id
    // @access  Admin
    // ======================================================

    export const updateUser = asyncHandler(async (req, res, next) => {

        // Prevent password updates here
        if (req.body.password) {
            return next(
                new AppError(
                    "This route is not for password updates",
                    400
                )
            );
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedUser) {
            return next(new AppError("User not found", 404));
        }

        res.status(200).json({
            success: true,
            data: updatedUser
        });
    });


    // ======================================================
    // @desc    Soft delete user by admin
    // @route   DELETE /api/users/:id
    // @access  Admin
    // ======================================================

    export const deleteUser = asyncHandler(async (req, res, next) => {

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                isDeleted: true
            },
            {
                new: true
            }
        );

        if (!user) {
            return next(new AppError("User not found", 404));
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    });