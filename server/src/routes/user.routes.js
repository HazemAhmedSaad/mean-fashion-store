import express from "express";

import { protect } from './../middlewares/authentication.middleware.js';
import { restrictTo as authorize } from './../middlewares/authorization.middleware.js';

import {
    getMe,
    updateMe,
    changePassword,
    addAddress,
    deleteAddress,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser
} from "../controllers/user.controller.js";
const router = express.Router();


// ======================================
// Protected Routes
// ======================================

router.use(protect);


// ======================================
// Current User
// ======================================

router.get(
    "/me",
    getMe
);

router.patch(
    "/updateMe",
    updateMe
);

router.patch(
    "/changeMyPassword",
    changePassword
);

router.delete(
    "/deleteMe",
    deleteUser
);


// ======================================
// Addresses
// ======================================

router.post(
    "/address",
    addAddress
);

router.patch(
    "/address/:id",
    addAddress
);

router.delete(
    "/address/:id",
    deleteAddress
);


// ======================================
// Admin Routes
// ======================================

router.use(authorize("admin"));

router.route("/")
    .get(getAllUsers);

router.route("/:id")
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);


export default router;