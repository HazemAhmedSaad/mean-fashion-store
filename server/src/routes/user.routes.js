import express from "express";

import { protect } from "../middlewares/authentication.middleware.js";
import { restrictTo as authorize } from "../middlewares/authorization.middleware.js";

import {
    getMe,
    updateMe,
    deleteMe,
    changePassword,
    addAddress,
    updateAddress,
    deleteAddress,
    getAllUsers,
    getDeletedUsers,
    getBlockedUsers,
    getUser,
    updateUser
} from "../controllers/user.controller.js";

const router = express.Router();


// ======================================
// Protected Routes
// ======================================

router.use(protect);


// ======================================
// Current User Routes
// ======================================

router.route("/me")
    .get(getMe)
    .patch(updateMe)
    .delete(deleteMe);

router.patch(
    "/me/password",
    changePassword
);


// ======================================
// Address Routes
// ======================================

router.route("/addresses")
    .post(addAddress);

router.route("/addresses/:id")
    .patch(updateAddress)
    .delete(deleteAddress);


// ======================================
// Admin Routes
// ======================================

router.use(authorize("admin"));

router.route("/")
    .get(getAllUsers);

router.route("/blocked")
    .get(getBlockedUsers);

router.route("/deleted")
    .get(getDeletedUsers);

router.route("/:id")
    .get(getUser)
    .patch(updateUser)


export default router;
