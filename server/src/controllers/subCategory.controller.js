import asyncHandler from "../utils/asyncHandler.js";
import SubCategory from "../models/subCategory.schema.js";
import Category from "../models/category.schema.js";
import AppError from "../utils/appError.js";
import APIFeatures from "../utils/apiFeatures.js";

const SUB_CATEGORY_NOT_FOUND = "Sub-category not found";
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

const ensureCategoryExists = async (categoryId) => {
  if (!categoryId) {
    throw new AppError("Category id is required", 400);
  }

  const category = await Category.findOne({
    _id: categoryId,
    isDeleted: false,
  });

  if (!category) {
    throw new AppError(CATEGORY_NOT_FOUND, 404);
  }
};

export const getAllSubCategories = asyncHandler(async (req, res) => {
  const baseFilter = {
    isDeleted: false,
  };

  if (req.query.categoryId) {
    baseFilter.categoryId = req.query.categoryId;
  }

  const totalDocuments = await SubCategory.countDocuments(baseFilter);

  const features = new APIFeatures(
    SubCategory.find(baseFilter).populate("categoryId", "title"),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate(totalDocuments);

  const subCategories = await features.query;

  res.status(200).json({
    success: true,
    results: subCategories.length,
    pagination: features.pagination,
    data: subCategories,
  });
});

export const getSubCategory = asyncHandler(async (req, res, next) => {
  const subCategory = await SubCategory.findOne({
    _id: req.params.id,
    isDeleted: false,
  }).populate("categoryId", "title");

  if (!subCategory) return next(new AppError(SUB_CATEGORY_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    data: subCategory,
  });
});

export const createSubCategory = asyncHandler(async (req, res) => {
  const subCategoryData = filterObj(req.body || {}, [
    "title",
    "categoryId",
    "isActive",
  ]);

  await ensureCategoryExists(subCategoryData.categoryId);

  const subCategory = await SubCategory.create(subCategoryData);

  // remove fields manually
  subCategory.__v = undefined;
  subCategory.isDeleted = undefined;

  res.status(201).json({
    success: true,
    data: subCategory,
  });
});

export const updateSubCategory = asyncHandler(async (req, res, next) => {
  const subCategoryData = filterObj(req.body || {}, [
    "title",
    "categoryId",
    "isActive",
    "isDeleted",
  ]);

  if (Object.keys(subCategoryData).length === 0) {
    return next(
      new AppError("Please provide at least one field to update", 400),
    );
  }

  if (subCategoryData.categoryId) {
    await ensureCategoryExists(subCategoryData.categoryId);
  }

  const subCategory = await SubCategory.findByIdAndUpdate(
    req.params.id,
    subCategoryData,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!subCategory) return next(new AppError(SUB_CATEGORY_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    data: subCategory,
  });
});

export const deleteSubCategory = asyncHandler(async (req, res, next) => {
  const subCategory = await SubCategory.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
      isActive: false,
    },
    {
      new: true,
      runValidators: true,
    },
  ).select("-__v -isDeleted");

  if (!subCategory) return next(new AppError(SUB_CATEGORY_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    message: "Sub-category deleted successfully",
  });
});
