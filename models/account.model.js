const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankUser",
      required: true,
    },
    accountNumber: {
      type: String,
      unique: true,
      required: true,
    },
    accountType: {
      type: String,
      enum: ["savings", "checking" , "current"],
      default: "savings",
    },
    balance: {
      type: Number,
      default: 100000.00, // Every new account starts with ₦100,000
      min: [0, "Balance cannot be negative"],
    },
    currency: {
      type: String,
      default: "NGN",
    },
    status: {
      type: String,
      enum: ["active", "frozen", "closed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Account", accountSchema);
