const mongoose = require("mongoose");

// ─── BILLER MODEL ────────────────────────────────────────────
const billerSchema = new mongoose.Schema(
  {
    billerName: { type: String, required: true, trim: true },
    billerCode: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: ["electricity", "internet", "cable", "water", "phone", "other"],
      default: "other",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── PAYMENT MODEL ───────────────────────────────────────────
const paymentSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    billerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Biller",
      required: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
    amount: { type: Number, required: true, min: 1 },
    customerReference: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "successful", "failed"],
      default: "pending",
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ─── USER SETTINGS MODEL ─────────────────────────────────────
const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankUser",
      required: true,
      unique: true,
    },
    profilePicture: { type: String, default: null },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    transactionAlerts: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── SECURITY SETTINGS MODEL ─────────────────────────────────
const securitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankUser",
      required: true,
      unique: true,
    },
    twoFAEnabled: { type: Boolean, default: false },
    twoFASecret: { type: String, default: null, select: false },
    dailyTransferLimit: { type: Number, default: 1000000 },   // ₦1,000,000
    singleTransferLimit: { type: Number, default: 500000 },   // ₦500,000
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = {
  Biller: mongoose.model("Biller", billerSchema),
  Payment: mongoose.model("Payment", paymentSchema),
  Settings: mongoose.model("Settings", settingsSchema),
  Security: mongoose.model("Security", securitySchema),
};
