const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Route imports
const authRoutes = require("./routers/auth.routes");
const userRoutes = require("./routers/user.routes");
const accountRoutes = require("./routers/account.routes");
const transactionRoutes = require("./routers/transactionHistory.routes");
const transferRoutes = require("./routers/transfer.routes");
const billerRoutes = require("./routers/biller.routes");
const paymentRoutes = require("./routers/payment.routes");
const { settingsRouter, securityRouter } = require("./routers/settings.routes");

// Middleware imports
const errorHandler = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");

dotenv.config();

const app = express();

// ─── VIEW ENGINE ─────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5000"
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter); // Apply rate limiting to all routes

// ─── DATABASE CONNECTION ──────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ─── ROUTES ───────────────────────────────────────────────────
app.use("/api/auth",         authRoutes);
app.use("/api/users",        userRoutes);
app.use("/api/accounts",     accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/transfers",    transferRoutes);
app.use("/api/billers",      billerRoutes);
app.use("/api/payments",     paymentRoutes);
app.use("/api/settings",     settingsRouter);
app.use("/api/security",     securityRouter);

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "🏦 SFA Bank API is running",
    version: "6.9.0",
    status: "healthy",
  });
});

// ─── VIEW ROUTES ─────────────────────────────────────────────
app.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// ─── DEBUG ENDPOINT ───────────────────────────────────────────
app.get("/debug/env", (req, res) => {
  res.json({
    NODE_MAIL: process.env.NODE_MAIL ? "✓ Set" : "✗ Not set",
    NODE_PASSWORD: process.env.NODE_PASSWORD ? "✓ Set" : "✗ Not set",
    MONGO_URI: process.env.MONGO_URI ? "✓ Set" : "✗ Not set",
    JWT_SECRET: process.env.JWT_SECRET ? "✓ Set" : "✗ Not set"
  });
});

// ─── ERROR HANDLER (must be last) ────────────────────────────
app.use(errorHandler);

// ─── START SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
