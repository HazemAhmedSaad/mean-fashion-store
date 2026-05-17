import asyncHandler from './../utils/asyncHandler.js';
import ProductModel from '../models/product.schema.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';

const PRODUCT_NOT_FOUND = 'Product not found';

const filterObj = (obj, allowedFields) => {
    const filteredObj = {};

    for (const key of allowedFields) {
        if (obj[key] !== undefined) {
            filteredObj[key] = obj[key];
        }
    }

    return filteredObj;
};

const createSlug = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const setProductImages = (req, productData) => {
    if (req.files && req.files.length > 0) {
        productData.images = req.files.map((file) => `/uploads/${file.filename}`);
    }
};

export const getAllProducts = asyncHandler(async (req, res) => {
    const totalDocuments = await ProductModel.countDocuments({
        isDeleted: false
    });

    const features = new APIFeatures(
        ProductModel.find({ isDeleted: false }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate(totalDocuments);

    const products = await features.query;

    res.status(200).json({
        success: true,
        results: products.length,
        pagination: features.pagination,
        data: products
    });
});

export const getSingleProductBySlug = asyncHandler(async (req, res, next) => {
    const product = await ProductModel.findOne({
        slug: req.params.slug,
        isDeleted: false
    });

    if (!product) return next(new AppError(PRODUCT_NOT_FOUND, 404));

    res.status(200).json({
        success: true,
        data: product
    });
});

export const getSingleProductById = asyncHandler(async (req, res, next) => {
    const product = await ProductModel.findOne({
        _id: req.params.id,
        isDeleted: false
    });

    if (!product) return next(new AppError(PRODUCT_NOT_FOUND, 404));

    const productObj = product.toObject();
    productObj.lowStockWarning = product.stock <= 3;

    res.status(200).json({
        success: true,
        data: productObj
    });
});

export const createProduct = asyncHandler(async (req, res) => {
    const productData = filterObj(req.body || {}, [
        'name',
        'description',
        'price',
        'images',
        'stock',
        'categoryId',
        'subCategoryId',
        'isActive'
    ]);

    setProductImages(req, productData);

    if (productData.name) {
        productData.slug = createSlug(productData.name);
    }

    const product = await ProductModel.create(productData);

    res.status(201).json({
        success: true,
        data: product
    });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
    const productData = filterObj(req.body || {}, [
        'name',
        'description',
        'price',
        'images',
        'stock',
        'categoryId',
        'subCategoryId',
        'isActive',
        'isDeleted'
    ]);

    setProductImages(req, productData);

    if (productData.name) {
        productData.slug = createSlug(productData.name);
    }

    if (Object.keys(productData).length === 0) {
        return next(
            new AppError('Please provide at least one field to update', 400)
        );
    }

    const product = await ProductModel.findByIdAndUpdate(
        req.params.id,
        productData,
        {
            new: true,
            runValidators: true
        }
    );

    if (!product) return next(new AppError(PRODUCT_NOT_FOUND, 404));

    res.status(200).json({
        success: true,
        data: product
    });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
    const product = await ProductModel.findByIdAndUpdate(
        req.params.id,
        {
            isDeleted: true,
            isActive: false
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!product) return next(new AppError(PRODUCT_NOT_FOUND, 404));

    res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
    });
});
