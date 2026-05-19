import Cart from "../models/cart.schema.js";
import Product from "../models/product.schema.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";

const CART_NOT_FOUND = "Cart not found";
const CART_ITEM_NOT_FOUND = "Cart item not found";
const PRODUCT_NOT_FOUND = "Product not found";

const calculateTotalPrice = (items) =>
  items.reduce((total, item) => total + item.priceAtAddition * item.quantity, 0);

const parseQuantity = (quantity) => Number(quantity);

const getActiveProduct = async (productId) => {
  const product = await Product.findOne({
    _id: productId,
    isDeleted: false,
    isActive: true,
  }).select("+isDeleted");

  if (!product) throw new AppError(PRODUCT_NOT_FOUND, 404);

  return product;
};

const populateCart = (query) =>
  query.populate({
    path: "items.productId",
    select: "name slug price images stock isActive",
  });

const findCartItem = (cart, itemId) =>
  cart.items.find(
    (cartItem) =>
      cartItem._id.toString() === itemId ||
      cartItem.productId.toString() === itemId,
  );

export const getMyCart = asyncHandler(async (req, res) => {
  const cart = await populateCart(Cart.findOne({ userId: req.user._id }));

  res.status(200).json({
    success: true,
    data: cart || {
      userId: req.user._id,
      items: [],
      totalPrice: 0,
    },
  });
});

export const addItemToCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.body || {};
  const quantity = parseQuantity(req.body?.quantity ?? 1);

  if (!productId) return next(new AppError("Product id is required", 400));
  if (!Number.isInteger(quantity) || quantity < 1) {
    return next(new AppError("Quantity must be a positive integer", 400));
  }

  const product = await getActiveProduct(productId);

  if (product.stock < quantity) {
    return next(new AppError("Requested quantity is not available in stock", 400));
  }

  let cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      userId: req.user._id,
      items: [
        {
          productId,
          quantity,
          priceAtAddition: product.price,
          isPriceChanged: false,
        },
      ],
      totalPrice: product.price * quantity,
    });
  } else {
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === String(productId),
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        return next(new AppError("Requested quantity is not available in stock", 400));
      }

      existingItem.quantity = newQuantity;
      existingItem.isPriceChanged = existingItem.priceAtAddition !== product.price;
      existingItem.priceAtAddition = product.price;
    } else {
      cart.items.push({
        productId,
        quantity,
        priceAtAddition: product.price,
        isPriceChanged: false,
      });
    }

    cart.totalPrice = calculateTotalPrice(cart.items);
    await cart.save();
  }

  const populatedCart = await populateCart(Cart.findById(cart._id));

  res.status(201).json({
    success: true,
    data: populatedCart,
  });
});

export const updateCartItem = asyncHandler(async (req, res, next) => {
  const quantity = parseQuantity(req.body?.quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return next(new AppError("Quantity must be a positive integer", 400));
  }

  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) return next(new AppError(CART_NOT_FOUND, 404));

  const item = findCartItem(cart, req.params.itemId);
  if (!item) return next(new AppError(CART_ITEM_NOT_FOUND, 404));

  const product = await getActiveProduct(item.productId);

  if (product.stock < quantity) {
    return next(new AppError("Requested quantity is not available in stock", 400));
  }

  item.quantity = quantity;
  item.isPriceChanged = item.priceAtAddition !== product.price;
  item.priceAtAddition = product.price;
  cart.totalPrice = calculateTotalPrice(cart.items);

  await cart.save();

  const populatedCart = await populateCart(Cart.findById(cart._id));

  res.status(200).json({
    success: true,
    data: populatedCart,
  });
});

export const deleteCartItem = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) return next(new AppError(CART_NOT_FOUND, 404));

  const item = findCartItem(cart, req.params.itemId);
  if (!item) return next(new AppError(CART_ITEM_NOT_FOUND, 404));

  cart.items.pull(item._id);
  cart.totalPrice = calculateTotalPrice(cart.items);

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart item deleted successfully",
    data: cart,
  });
});

export const deleteMyCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndDelete({ userId: req.user._id });

  if (!cart) return next(new AppError(CART_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    message: "Cart deleted successfully",
  });
});
