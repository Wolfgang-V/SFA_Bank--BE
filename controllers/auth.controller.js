﻿const BankUser = require("../models/bankUser.model");
const Account = require("../models/account.model");
const OTPModel = require("../models/otp.model");
const { sendTokenResponse, asyncHandler } = require("../models/utils/helper");
const { mailSender } = require("../middleware/mailer");
const otpGenerator = require("otp-generator");

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

  // Send welcome email
  try {
    const firstName = fullName.split(' ')[0];
    const lastName = fullName.split(' ').slice(1).join(' ') || '';
    await mailSender(
      email,
      "Welcome to SFA Bank!",
      "welcomeMail",
      { 
        firstName,
        lastName, 
        bankName: 'SFA Bank'
      }
    );
    console.log('Welcome email sent to', email);
  } catch (emailError) {
    console.error('Welcome email failed for', email + ':', emailError.message);
  }

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

// POST /api/auth/forgot-password - Request OTP
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = await BankUser.findOne({ email });
    
    if (!user) {
        // Don't reveal if user exists
        return res.status(200).json({ success: true, message: "If the account exists, an OTP will be sent." });
    }

    // Generate OTP
    const otp = otpGenerator.generate(4, { 
        upperCaseAlphabets: false, 
        specialChars: false, 
        lowerCaseAlphabets: false, 
        digits: true 
    });

    // Save OTP to database
    await OTPModel.create({ email, otp });

    // Send OTP email
    const result = await mailSender(
        email,
        "Password Reset OTP - SFA Bank",
        "otpMail",
        { 
            otp: otp,
            firstName: user.fullName.split(' ')[0]
        }
    );

    if (!result.success) {
        return res.status(500).json({ success: false, message: "Failed to send OTP email." });
    }

    return res.status(200).json({ success: true, message: "OTP sent successfully to your email." });
});

// POST /api/auth/reset-password - Verify OTP and reset password
const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "Email, OTP, and new password are required." });
    }

    // Find valid OTP
    const validOTP = await OTPModel.findOne({ email, otp }).sort({ createdAt: -1 });
    
    if (!validOTP) {
        return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    // Check if OTP is expired (handled by MongoDB TTL, but double check)
    const now = new Date();
    const otpTime = new Date(validOTP.createdAt);
    const diffMinutes = (now - otpTime) / 1000 / 60;
    
    if (diffMinutes > 5) {
        return res.status(400).json({ success: false, message: "OTP has expired." });
    }

    // Find user and update password
    const user = await BankUser.findOne({ email });
    
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    user.password = newPassword;
    await user.save();

    // Delete used OTP
    await OTPModel.deleteMany({ email });

    return res.status(200).json({ success: true, message: "Password reset successfully." });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  res.status(200).json({ success: true, data: user.toSafeObject() });
});

// GET /api/auth/users/:id - Get user by ID
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await BankUser.findById(id);
  
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  
  res.status(200).json({ success: true, data: user.toSafeObject() });
});

module.exports = { register, login, forgotPassword, resetPassword, getMe, getUserById };
