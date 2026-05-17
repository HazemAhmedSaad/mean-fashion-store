import express from "express";

import {
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} from "../controllers/category.controller.js";
import { protect } from "../middlewares/authentication.middleware.js";
import { restrictTo as authorize } from "../middlewares/authorization.middleware.js";

const router = express.Router();

router.route("/")
    .get(getAllCategories)
    .post(
        protect,
        authorize("admin"),
        createCategory
    );

router.route("/:id")
    .get(getCategory)
    .patch(
        protect,
        authorize("admin"),
        updateCategory
    )
    .delete(
        protect,
        authorize("admin"),
        deleteCategory
    );

export default router;
