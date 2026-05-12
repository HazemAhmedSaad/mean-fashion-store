import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import corsMiddlewares from './middlewares/cors.middleware.js';
import AppError from './utils/appError.js';
import globalErrorHandler from './middlewares/errorHandler.middleware.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
// استيراد المسارات (Routes)
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
// import productRoutes from './routes/product.routes.js';

// 1. تحميل متغيرات البيئة (Environment Variables)
dotenv.config();

// 2. الاتصال بقاعدة البيانات
connectDB();

// 3. تشغيل السيرفر
const PORT = process.env.PORT || 5000;
// import orderRoutes from './routes/orderRoutes.js'; (أضفها عند اكتمالها)

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Global Middlewares
app.use(corsMiddlewares); // السماح بالاتصال من الـ Front-end
app.use(express.json()); // استقبال البيانات بصيغة JSON


// 2. Static Files (للوصول لصور المنتجات المرفوعة)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 3. Mounting Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/products', productRoutes);
// app.use('/api/v1/orders', orderRoutes);


// 4. Handling Undefined Routes (أي مسار غير موجود)
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// 5. Global Error Handling Middleware
app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});