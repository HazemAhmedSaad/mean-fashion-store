import jwt from 'jsonwebtoken';
import User from '../models/user.schema.js';
import asyncHandler from './../utils/asyncHandler.js';
import AppError from './../utils/appError.js';


// ======================================
// Protect Middleware
// ======================================

export const protect = asyncHandler(async (req, res, next) => {

  let token;

  // Check authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // No token
  if (!token) {
    return next(
      new AppError(
        "You are not logged in. Please login first",
        401
      )
    );
  }

  // Verify token
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET_KEY
  );

  // Find current user
  const currentUser = await User.findById(decoded.id);

  // User no longer exists
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token no longer exists",
        401
      )
    );
  }

  // Check soft delete
  if (currentUser.isDeleted) {
    return next(
      new AppError(
        "This account has been deleted",
        401
      )
    );
  }

  // Attach user to request
  req.user = currentUser;

  next();
});

