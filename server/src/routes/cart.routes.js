import express from "express";

import {
  getMyCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
  deleteMyCart,
} from "../controllers/cart.controller.js";
import { protect } from "../middlewares/authentication.middleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getMyCart)
  .post(addItemToCart)
  .delete(deleteMyCart);

router.route("/items/:itemId")
  .patch(updateCartItem)
  .delete(deleteCartItem);

export default router;
