import express from "express";

import {
    getAllProducts,
    getSingleProductBySlug,
    getSingleProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from "../controllers/product.controller.js";
import { protect } from "../middlewares/authentication.middleware.js";
import { restrictTo as authorize } from "../middlewares/authorization.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.route("/")
    .get(getAllProducts)
    .post(
        protect,
        authorize("admin"),
        upload.array("images", 5),
        createProduct
    );

router.route("/slug/:slug")
    .get(getSingleProductBySlug);

router.route("/:id")
    .get(getSingleProductById)
    .patch(
        protect,
        authorize("admin"),
        upload.array("images", 5),
        updateProduct
    )
    .delete(
        protect,
        authorize("admin"),
        deleteProduct
    );

export default router;
