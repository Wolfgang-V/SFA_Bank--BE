const express = require("express");
const mongoose = require("mongoose");
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

// Import Biller model for seeding
const { Biller } = require("./models/other.model");

// Middleware
const errorHandler = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");

// Billers data for seeding
const billersData = [
  // Electricity
  { billerName: "EKEDC (Eko Electric)",      billerCode: "EKEDC",     category: "electricity" },
  { billerName: "IKEDC (Ikeja Electric)",     billerCode: "IKEDC",     category: "electricity" },
  { billerName: "AEDC (Abuja Electric)",      billerCode: "AEDC",      category: "electricity" },
  { billerName: "PHEDC (Port Harcourt)",      billerCode: "PHEDC",     category: "electricity" },
  // Internet
  { billerName: "MTN Internet",               billerCode: "MTN_INT",   category: "internet" },
  { billerName: "Glo Internet",               billerCode: "GLO_INT",   category: "internet" },
  { billerName: "Spectranet",                 billerCode: "SPECTRA",   category: "internet" },
  { billerName: "Smile 4G",                   billerCode: "SMILE",     category: "internet" },
  // Cable TV
  { billerName: "DSTV",                       billerCode: "DSTV",      category: "cable" },
  { billerName: "GOtv",                       billerCode: "GOTV",      category: "cable" },
  { billerName: "StarTimes",                  billerCode: "STIMES",    category: "cable" },
  // Phone/Airtime
  { billerName: "MTN",                        billerCode: "MTN",       category: "phone" },
  { billerName: "Glo",                        billerCode: "GLO",       category: "phone" },
  { billerName: "Airtel",                     billerCode: "AIRTEL",    category: "phone" },
  { billerName: "9mobile",                    billerCode: "9MOB",      category: "phone" },
  // Water
  { billerName: "Lagos Water Corp",           billerCode: "LWSC",      category: "water" },
  { billerName: "FCT Water Board",            billerCode: "FWSC",      category: "water" },
  // Betting
  { billerName: "SPORTYBET",                  billerCode: "SPORTY",    category: "betting" },
  { billerName: "BETKING (NG)",               billerCode: "BETKINGNG", category: "betting" },
  { billerName: "BET9JA (9JA)",               billerCode: "BET9JA",    category: "betting" },
  { billerName: "1X BET",                     billerCode: "1XBT",      category: "betting" },
  // Other
  { billerName: "Remita",                     billerCode: "REMITA",    category: "other" },
  { billerName: "LAWMA (Waste)",              billerCode: "LAWMA",     category: "other" },
];

async function seedBillersIfEmpty() {
  try {
    const count = await Biller.countDocuments();
    if (count === 0) {
      await Biller.insertMany(billersData);
      console.log("✅ Seeded billers data");
    }
  } catch (error) {
    console.error("❌ Error seeding billers:", error.message);
  }
}

dotenv.config();

const app = express();

// ───────────────── VIEW ENGINE ─────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ───────────────── CORS ─────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://sfa-bank-fe.vercel.app",
  "https://sfabank.vercel.app"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// ───────────────── MIDDLEWARE ─────────────────
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
app.use("/api/auth",         authRoutes);
app.use("/api/users",        userRoutes);
app.use("/api/accounts",     accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/transfers",    transferRoutes);
app.use("/api/billers",      billerRoutes);
app.use("/api/payments",     paymentRoutes);
app.use("/api/settings",     settingsRouter);
app.use("/api/security",     securityRouter);

// ───────────────── HEALTH CHECK ─────────────────
app.get("/", (req, res) => {
  res.json({
    message: "🏦 SFA Bank API is running",
    version: "7.0.0",
    status: "healthy",
  });
});

// ───────────────── VIEW ROUTES ─────────────────
app.get("/forgot-password", (req, res) => res.render("forgot-password"));
app.get("/login",           (req, res) => res.render("login"));
app.get("/register",        (req, res) => res.render("register"));

// ───────────────── DEBUG ROUTE ─────────────────
app.get("/debug/env", (req, res) => {
  res.json({
    NODE_MAIL:     process.env.NODE_MAIL     ? "✓ Set" : "✗ Not set",
    NODE_PASSWORD: process.env.NODE_PASSWORD ? "✓ Set" : "✗ Not set",
    MONGO_URI:     process.env.MONGO_URI     ? "✓ Set" : "✗ Not set",
    JWT_SECRET:    process.env.JWT_SECRET    ? "✓ Set" : "✗ Not set",
  });
});

// ───────────────── ERROR HANDLER ─────────────────
app.use(errorHandler);

// ───────────────── LOCAL SERVER ─────────────────
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(async () => {
    await seedBillersIfEmpty();
    app.listen(PORT, () => {
      console.log(`🚀 Server running locally on http://localhost:${PORT}`);
    });
  });
}

// ───────────────── VERCEL SERVERLESS EXPORT ─────────────────
module.exports = async (req, res) => {
  await connectDB();
  await seedBillersIfEmpty();
  return app(req, res);
};