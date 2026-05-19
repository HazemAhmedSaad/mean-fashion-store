import Cart from "../models/cart.schema.js";
import Order from "../models/order.schema.js";
import Product from "../models/product.schema.js";
import User from "../models/user.schema.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import APIFeatures from "../utils/apiFeatures.js";

const ORDER_NOT_FOUND = "Order not found";

const getOrderFilter = (req) => {
  const filter = {
    _id: req.params.id,
    isDeleted: false,
  };

  if (req.user.role !== "admin") {
    filter.userId = req.user._id;
  }

  return filter;
};

const getShippingAddress = async (userId, addressId, fallbackAddress) => {
  if (fallbackAddress?.addressText && fallbackAddress?.phone) {
    return fallbackAddress;
  }

  if (!addressId) {
    throw new AppError("Please provide shipping address", 400);
  }

  const user = await User.findById(userId);
  const address = user?.addresses.id(addressId);

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  return {
    addressText: [address.city, address.street, address.building, address.notes]
      .filter(Boolean)
      .join(", "),
    phone: address.phoneNumber,
  };
};

export const createOrder = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ userId: req.user._id });

  if (!cart || cart.items.length === 0) {
    return next(new AppError("Cart is empty", 400));
  }

  const orderItems = [];

  for (const item of cart.items) {
    const product = await Product.findOne({
      _id: item.productId,
      isDeleted: false,
      isActive: true,
    }).select("+isDeleted");

    if (!product) {
      return next(
        new AppError("One of cart products is no longer available", 400),
      );
    }

    if (product.stock < item.quantity) {
      return next(
        new AppError(`${product.name} does not have enough stock`, 400),
      );
    }

    orderItems.push({
      productId: product._id,
      quantity: item.quantity,
      priceAtOrderTime: product.price,
    });
  }

  const totalPrice = orderItems.reduce(
    (total, item) => total + item.priceAtOrderTime * item.quantity,
    0,
  );

  const shippingAddress = await getShippingAddress(
    req.user._id,
    req.body?.addressId,
    req.body?.shippingAddress,
  );

  const order = await Order.create({
    userId: req.user._id,
    items: orderItems,
    shippingAddress,
    totalPrice,
  });

  await Promise.all(
    orderItems.map((item) =>
      Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      }),
    ),
  );

  await Cart.findByIdAndDelete(cart._id);

  res.status(201).json({
    success: true,
    data: order,
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const totalDocuments = await Order.countDocuments({
    userId: req.user._id,
    isDeleted: false,
  });

  const features = new APIFeatures(
    Order.find({ userId: req.user._id, isDeleted: false }).populate(
      "items.productId",
      "name slug images price",
    ),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate(totalDocuments);

  const orders = await features.query;

  res.status(200).json({
    success: true,
    results: orders.length,
    pagination: features.pagination,
    data: orders,
  });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const totalDocuments = await Order.countDocuments({ isDeleted: false });

  const features = new APIFeatures(
    Order.find({ isDeleted: false })
      .populate("userId", "name phone email")
      .populate("items.productId", "name slug images price"),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate(totalDocuments);

  const orders = await features.query;

  res.status(200).json({
    success: true,
    results: orders.length,
    pagination: features.pagination,
    data: orders,
  });
});

export const getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findOne(getOrderFilter(req))
    .populate("userId", "name phone email")
    .populate("items.productId", "name slug images price");

  if (!order) return next(new AppError(ORDER_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    data: order,
  });
});

export const cancelMyOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  });

  if (!order) return next(new AppError(ORDER_NOT_FOUND, 404));

  if (!["pending", "preparing"].includes(order.status)) {
    return next(new AppError("This order can not be canceled now", 400));
  }

  order.status = "canceled_by_user";
  await order.save();

  res.status(200).json({
    success: true,
    data: order,
  });
});

export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body || {};

  if (!status) return next(new AppError("Status is required", 400));

  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      isDeleted: false,
    },
    { status },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!order) return next(new AppError(ORDER_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    data: order,
  });
});

export const deleteOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!order) return next(new AppError(ORDER_NOT_FOUND, 404));

  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});
