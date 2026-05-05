# 👕 MEAN Fashion Store

A full-stack clothing e-commerce application built with the **MEAN stack** (Angular, Express, MongoDB) and styled using **Tailwind CSS**.

---

## 🚀 Overview

This project is a modern online fashion store where users can browse products, add items to cart, and place orders. It is designed with scalability and clean architecture in mind.

---

## 🛠️ Tech Stack

### Frontend

* Angular
* Tailwind CSS
* RxJS

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)

---

## ✨ Features

* 🔐 User authentication (JWT)
* 🛍️ Product listing & filtering
* 🛒 Shopping cart system
* 📦 Order management
* ⚡ RESTful API integration
* 📱 Responsive UI (mobile-friendly)

---

## 📁 Project Structure

```
mean-fashion-store/
│
├── client/        # Angular frontend
│   └── app/
│
├── server/        # Express backend
│   ├── models/
│   ├── routes/
│   ├── controllers/
│
├── README.md
└── .gitignore
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/HazemAhmedSaad/mean-fashion-store.git
cd mean-fashion-store
```

---

### 2. Install dependencies

#### Backend

```bash
cd server
npm install
```

#### Frontend

```bash
cd ../client/app
npm install
```

---

### 3. Environment Variables

Create a `.env` file inside `server/`:

```
MONGO_URI=mongodb://127.0.0.1:27017/mean-fashion
PORT=5000
```

---

### 4. Run the application

#### Start backend

```bash
cd server
npm run dev
```

#### Start frontend

```bash
cd client/app
ng serve
```

---

## 🌐 API Base URL

```
http://localhost:5000
```

---

## 📌 Future Improvements

* 💳 Payment integration (Stripe)
* ⭐ Product reviews & ratings
* 📊 Admin dashboard
* ❤️ Wishlist feature

---

## 👨‍💻 Author

**Hazem Ahmed**

---

## 📄 License

This project is open-source and available under the MIT License.
