import asyncHandler from "../utils/asyncHandler.js";
import Category from "../models/category.schema.js";
import AppError from "../utils/appError.js";
import APIFeatures from "../utils/apiFeatures.js";

const CATEGORY_NOT_FOUND = "Category not found";

const filterObj = (obj, allowedFields) => {
  const filteredObj = {};

  for (const key of allowedFields) {
    if (obj[key] !== undefined) {
      filteredObj[key] = obj[key];
    }
  }

  return filteredObj;
};

export const getAllCategories = asyncHandler(async (req, res) => {
  const totalDocuments = await Category.countDocuments({
    isDeleted: false,
  });

  const features = new APIFeatures(
    Category.find({ isDeleted: false }),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate(totalDocuments);

  const categories = await features.query;

  res.status(200).json({
    success: true,
    results: categories.length,
    pagination: features.pagination,
    data: categories,
  });
});

export const getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!category) return next(new AppError(CATEGORY_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    data: category,
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const categoryData = filterObj(req.body || {}, ["title", "isActive"]);

  const category = await Category.create(categoryData);

  res.status(201).json({
    success: true,
    data: category,
  });
});

export const updateCategory = asyncHandler(async (req, res, next) => {
  const categoryData = filterObj(req.body || {}, ["title", "isActive"]);

  if (Object.keys(categoryData).length === 0) {
    return next(
      new AppError("Please provide at least one field to update", 400),
    );
  }

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    categoryData,
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!category) return next(new AppError(CATEGORY_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    data: category,
  });
});

export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
      isActive: false,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!category) return next(new AppError(CATEGORY_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});
