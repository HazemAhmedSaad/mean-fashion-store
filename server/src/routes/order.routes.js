import express from "express";

import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrder,
  cancelMyOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/order.controller.js";
import { protect } from "../middlewares/authentication.middleware.js";
import { restrictTo as authorize } from "../middlewares/authorization.middleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .post(createOrder)
  .get(authorize("admin"), getAllOrders);

router.route("/my-orders")
  .get(getMyOrders);

router.route("/:id")
  .get(getOrder)
  .delete(authorize("admin"), deleteOrder);

router.patch("/:id/cancel", cancelMyOrder);
router.patch("/:id/status", authorize("admin"), updateOrderStatus);

export default router;
