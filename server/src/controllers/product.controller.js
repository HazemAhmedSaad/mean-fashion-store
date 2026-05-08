import asyncHandler from './../utils/asyncHandler.js';
import ProductModel from '../models/product.schema.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';

export const getAllProducts = asyncHandler(async (req, res, next) => {
    // نمرر فلتر افتراضي لاستبعاد المحذوفين
    const features = new APIFeatures(ProductModel.find({ isDeleted: false }), req.query)
        .filter()
        .sort()
        .paginate();

    const products = await features.query;
    res.status(200).json({ success: true, data: products, pagination: features.pagination });
});

export const getSingleProductById = asyncHandler(async (req, res, next) => {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));
    res.status(200).json({ success: true, data: product });
});

export const getSingleProductBySlug = asyncHandler(async (req, res, next) => {
    const product = await ProductModel.findOne({ slug: req.params.slug });
    if (!product) return next(new AppError('Product not found', 404));
    res.status(200).json({ success: true, data: product });
})

export const createProduct = asyncHandler(async (req, res, next) => {
    const product = await ProductModel.create(req.body);
    res.status(201).json({ success: true, data: product });
});

// export const updateProduct = asyncHandler(async (req, res, next) => {
//     const product = await ProductModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
//     if (!product) return next(new AppError('Product not found', 404));
//     res.status(200).json({ success: true, data: product });
// });

export const getSingleProductById = asyncHandler(async (req, res, next) => {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));

    // تحويل الـ document لـ object عشان نعدل عليه
    const productObj = product.toObject();
    productObj.lowStockWarning = product.stock <= 3;

    res.status(200).json({ success: true, data: productObj });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
    const product = await ProductModel.findByIdAndUpdate(
        req.params.id,
        { isDeleted: true, isActive: false }, 
        { new: true, runValidators: true }
    );
    if (!product) return next(new AppError('Product not found', 404));
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
});