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

// Middleware
const errorHandler = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");

dotenv.config();

const app = express();


// ───────────────── VIEW ENGINE ─────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


// ───────────────── MIDDLEWARE ─────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "https://sfa-bank-fe.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);


// ───────────────── DATABASE CONNECTION ─────────────────
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;

  console.log("✅ MongoDB connected");
  return cached.conn;
}


// ───────────────── ROUTES ─────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/billers", billerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/settings", settingsRouter);
app.use("/api/security", securityRouter);


// ───────────────── HEALTH CHECK ─────────────────
app.get("/", (req, res) => {
  res.json({
    message: "🏦 SFA Bank API is running",
    version: "7.0.0",
    status: "healthy",
  });
});


// ───────────────── VIEW ROUTES ─────────────────
app.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});


// ───────────────── DEBUG ROUTE ─────────────────
app.get("/debug/env", (req, res) => {
  res.json({
    NODE_MAIL: process.env.NODE_MAIL ? "✓ Set" : "✗ Not set",
    NODE_PASSWORD: process.env.NODE_PASSWORD ? "✓ Set" : "✗ Not set",
    MONGO_URI: process.env.MONGO_URI ? "✓ Set" : "✗ Not set",
    JWT_SECRET: process.env.JWT_SECRET ? "✓ Set" : "✗ Not set",
  });
});


// ───────────────── ERROR HANDLER ─────────────────
app.use(errorHandler);


// ───────────────── LOCAL SERVER ─────────────────
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running locally on http://localhost:${PORT}`);
    });
  });
}


// ───────────────── VERCEL SERVERLESS EXPORT ─────────────────
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};