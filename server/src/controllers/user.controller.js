import User from "../models/user.schema.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import APIFeatures from "../utils/apiFeatures.js";


// ======================================================
// Constants
// ======================================================

const USER_NOT_FOUND = "User not found";
const ADDRESS_NOT_FOUND = "Address not found";


// ======================================================
// Filter Allowed Fields Utility
// ======================================================

const filterObj = (obj, allowedFields) => {
    const filteredObj = {};

    for (const key of allowedFields) {
        if (obj[key] !== undefined) {
            filteredObj[key] = obj[key];
        }
    }

    return filteredObj;
};


// ======================================================
// Get User Helper
// ======================================================

const getUserById = async (id, select = "") => {

    const user = await User.findById(id).select("+isDeleted -__v ");
    if (!user || user.isDeleted) {
        throw new AppError(USER_NOT_FOUND, 404);
    }
    // remove sensitive fields
    user.isDeleted = undefined;
    return user;
};


// ======================================================
// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
// ======================================================

export const getMe = asyncHandler(async (req, res) => {

    const user = await getUserById(req.user._id);

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

    // Prevent password updates
    if (req.body.password || req.body.newPassword) {
        return next(
            new AppError(
                "This route is not for password updates. Please use /change-password",
                400
            )
        );
    }

    // Filter allowed fields
    const filteredBody = filterObj(req.body, [
        "name",
        "email",
        "phone",
        "gender"
    ]);

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        filteredBody,
        {
            new: true,
            runValidators: true
        }
    ).select("-password");

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
            new AppError(
                "Please provide current password and new password",
                400
            )
        );
    }

    const user = await getUserById(
        req.user._id,
        "+password"
    );

    // Check current password
    const isMatch = await user.correctPassword(currentPassword);

    if (!isMatch) {
        return next(
            new AppError(
                "Current password is incorrect",
                401
            )
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

export const deleteMe = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(req.user._id, {
        isDeleted: true
    });

    res.status(200).json({
        success: true,
        message: 'User deleted successfully'
    });
});


// ======================================================
// @desc    Add address
// @route   POST /api/users/address
// @access  Private
// ======================================================

export const addAddress = asyncHandler(async (req, res) => {

    const user = await getUserById(req.user._id);

    const addressData = filterObj(req.body, [
        "label",
        "city",
        "street",
        "building",
        "notes",
        "phoneNumber",
        "isDefault"
    ]);

    // first address should be default
    if (user.addresses.length === 0) {
        addressData.isDefault = true;
    }

    // if user selected new default address
    if (addressData.isDefault === true) {

        user.addresses.forEach((address) => {
            address.isDefault = false;
        });

    }

    user.addresses.push(addressData);

    await user.save();

    res.status(201).json({
        success: true,
        data: user.addresses
    });

});


// ======================================================
// @desc    Update address
// @route   PUT /api/users/address/:id
// @access  Private
// ======================================================

export const updateAddress = asyncHandler(async (req, res, next) => {

    const user = await getUserById(req.user._id);

    const address = user.addresses.id(req.params.id);

    if (!address) {
        return next(
            new AppError(ADDRESS_NOT_FOUND, 404)
        );
    }

    const addressData = filterObj(req.body, [
        "label",
        "city",
        "street",
        "building",
        "notes",
        "phoneNumber",
        "isDefault"
    ]);

    // Remove old default address
    if (addressData.isDefault === true) {
        user.addresses.forEach((addr) => {
            addr.isDefault = false;
        });
    }
    else {
        delete addressData.isDefault; // prevent unsetting default if not provided
    }

    // Update address
    Object.assign(address, addressData);

    await user.save();

    res.status(200).json({
        success: true,
        data: user.addresses
    });
});


// ======================================================
// @desc    Delete address
// @route   DELETE /api/users/address/:id
// @access  Private
// ======================================================
export const deleteAddress = asyncHandler(async (req, res, next) => {

    const user = await getUserById(req.user._id);

    const address = user.addresses.id(req.params.id);

    if (!address) {
        return next(
            new AppError(ADDRESS_NOT_FOUND, 404)
        );
    }

    const wasDefault = address.isDefault;

    // delete address
    user.addresses.pull(req.params.id);

    // if deleted address was default
    if (wasDefault && user.addresses.length > 0) {

        // make first address default
        user.addresses[0].isDefault = true;
    }

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

export const getAllUsers = asyncHandler(async (req, res) => {

    const totalDocuments = await User.countDocuments({
        isDeleted: { $ne: true }
    });

    const features = new APIFeatures(
        User.find(),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate(totalDocuments);
    const users = await features.query;

    res.status(200).json({
        success: true,
        results: users.length,
        pagination: features.pagination,
        data: users
    });

});

// ======================================================
// @desc    Get deleted users
// @route   GET /api/users/deleted
// @access  Admin
// ======================================================

export const getDeletedUsers = asyncHandler(async (req, res) => {

    const totalDocuments = await User.countDocuments({
        isDeleted: true
    });

    const features = new APIFeatures(
        User.find({ isDeleted: true }).select("+isDeleted"),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate(totalDocuments);
    const users = await features.query.select("+isDeleted");

    res.status(200).json({
        success: true,
        results: users.length,
        pagination: features.pagination,
        data: users
    });

});

// ======================================================
// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin
// ======================================================

export const getUser = asyncHandler(async (req, res) => {

    const user = await getUserById(req.params.id);

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

    const body = req.body || {};

    // Prevent password updates
    if (body.password || body.newPassword) {
        return next(
            new AppError(
                "This route is not for password updates",
                400
            )
        );
    }

    const filteredBody = filterObj(body, [
        "name",
        "phone",
        "email",
        "gender",
        "addresses",
        "role",
        "isActive",
        "isDeleted"
    ]);

    if (Object.keys(filteredBody).length === 0) {
        return next(
            new AppError(
                "Please provide at least one field to update",
                400
            )
        );
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        filteredBody,
        {
            new: true,
            runValidators: true
        }
    ).select('+isDeleted -__v');
    if (!updatedUser) {
        return next(
            new AppError(USER_NOT_FOUND, 404)
        );
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
        return next(
            new AppError(USER_NOT_FOUND, 404)
        );
    }

    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });
});
