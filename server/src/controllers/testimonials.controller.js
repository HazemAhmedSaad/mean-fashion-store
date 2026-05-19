import Testimonial from "../models/testimonials.schema.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import APIFeatures from "../utils/apiFeatures.js";

const TESTIMONIAL_NOT_FOUND = "Testimonial not found";

const filterObj = (obj, allowedFields) => {
  const filteredObj = {};

  for (const key of allowedFields) {
    if (obj[key] !== undefined) {
      filteredObj[key] = obj[key];
    }
  }

  return filteredObj;
};

export const getVisibleTestimonials = asyncHandler(async (req, res) => {
  const filter = {
    status: "approved",
    isVisible: true,
  };

  const features = new APIFeatures(
    Testimonial.find(filter),
    req.query,
  )
    .filter();

  const totalDocuments = await Testimonial.countDocuments({
    ...features.filterQuery,
    ...filter,
  });

  features
    .sort()
    .limitFields()
    .paginate(totalDocuments);

  const testimonials = await features.query;

  res.status(200).json({
    success: true,
    results: testimonials.length,
    pagination: features.pagination,
    data: testimonials,
  });
});

export const getAllTestimonials = asyncHandler(async (req, res) => {
  const features = new APIFeatures(
    Testimonial.find(),
    req.query,
  )
    .filter();

  const totalDocuments = await Testimonial.countDocuments(features.filterQuery);

  features
    .sort()
    .limitFields()
    .paginate(totalDocuments);

  const testimonials = await features.query;

  res.status(200).json({
    success: true,
    results: testimonials.length,
    pagination: features.pagination,
    data: testimonials,
  });
});

export const getTestimonial = asyncHandler(async (req, res, next) => {
  const testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial) return next(new AppError(TESTIMONIAL_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    data: testimonial,
  });
});

export const createTestimonial = asyncHandler(async (req, res) => {
  const testimonialData = filterObj(req.body || {}, [
    "name",
    "phone",
    "comment",
    "stars",
  ]);

  const testimonial = await Testimonial.create(testimonialData);

  res.status(201).json({
    success: true,
    data: testimonial,
  });
});

export const updateTestimonial = asyncHandler(async (req, res, next) => {
  const testimonialData = filterObj(req.body || {}, [
    "status",
    "isVisible",
  ]);

  if (Object.keys(testimonialData).length === 0) {
    return next(new AppError("Please provide at least one field to update", 400));
  }

  const testimonial = await Testimonial.findByIdAndUpdate(
    req.params.id,
    testimonialData,
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!testimonial) return next(new AppError(TESTIMONIAL_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    data: testimonial,
  });
});

export const deleteTestimonial = asyncHandler(async (req, res, next) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

  if (!testimonial) return next(new AppError(TESTIMONIAL_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    message: "Testimonial deleted successfully",
  });
});
