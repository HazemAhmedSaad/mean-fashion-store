import express from "express";

import {
  getVisibleTestimonials,
  getAllTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonials.controller.js";
import { protect } from "../middlewares/authentication.middleware.js";
import { restrictTo as authorize } from "../middlewares/authorization.middleware.js";

const router = express.Router();

router.route("/")
  .get(getVisibleTestimonials)
  .post(createTestimonial);

router.use(protect, authorize("admin"));

router.route("/admin")
  .get(getAllTestimonials);

router.route("/:id")
  .get(getTestimonial)
  .patch(updateTestimonial)
  .delete(deleteTestimonial);

export default router;