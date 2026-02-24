﻿const BankUser = require("../models/bankUser.model");
const Account = require("../models/account.model");
const { sendTokenResponse, asyncHandler } = require("../models/utils/helper");

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: "fullName, email and password are required." });
  }
  const existing = await BankUser.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, message: "User already exists." });
  }

  // accountNumber is auto-generated in the pre('save') hook on the model
  const user = await BankUser.create({ fullName, email, password });

  // Automatically create an Account document for the new user
  const account = await Account.create({
    userId: user._id,
    accountNumber: user.accountNumber,
    accountType: "savings",
    balance: 100000,
    currency: "NGN",
    status: "active"
  });

  sendTokenResponse(user, 201, res);
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "email and password required." });
  }
  const user = await BankUser.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  // Check if user has an Account, if not create one (for existing users before the fix)
  const existingAccount = await Account.findOne({ userId: user._id });
  if (!existingAccount) {
    await Account.create({
      userId: user._id,
      accountNumber: user.accountNumber,
      accountType: "savings",
      balance: user.balance || 100000,
      currency: "NGN",
      status: "active"
    });
  }

  sendTokenResponse(user, 200, res);
});

// POST /api/auth/forgot-password (placeholder)
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  return res.status(200).json({ success: true, message: "If the account exists, reset instructions will be sent." });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  res.status(200).json({ success: true, data: user.toSafeObject() });
});

module.exports = { register, login, forgotPassword, getMe };
