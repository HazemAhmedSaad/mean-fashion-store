import express from "express";

import {
    getAllSubCategories,
    getSubCategory,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory
} from "../controllers/subCategory.controller.js";
import { protect } from "../middlewares/authentication.middleware.js";
import { restrictTo as authorize } from "../middlewares/authorization.middleware.js";

const router = express.Router();

router.route("/")
    .get(getAllSubCategories)
    .post(
        protect,
        authorize("admin"),
        createSubCategory
    );

router.route("/:id")
    .get(getSubCategory)
    .patch(
        protect,
        authorize("admin"),
        updateSubCategory
    )
    .delete(
        protect,
        authorize("admin"),
        deleteSubCategory
    );

export default router;
