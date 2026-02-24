const BankUser = require("../models/bankUser.model");
const { Settings, Security } = require("../models/other.model");
const { asyncHandler } = require("../models/utils/helper");
const express = require("express");
const protect = require("../middleware/auth.middleware");

// ─── SETTINGS CONTROLLER ─────────────────────────────────────

// GET /api/settings/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await BankUser.findById(req.user._id);
  const settings = await Settings.findOne({ userId: req.user._id });
  res.status(200).json({ success: true, data: { ...user.toSafeObject(), settings } });
});

// PATCH /api/settings/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber } = req.body;
  const user = await BankUser.findByIdAndUpdate(
    req.user._id,
    { fullName, phoneNumber },
    { new: true, runValidators: true }
  );
  res.status(200).json({ success: true, data: user.toSafeObject() });
});

// PATCH /api/settings/password
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Both current and new password are required." });
  }

  const user = await BankUser.findById(req.user._id).select("+password");
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Current password is incorrect." });
  }

  user.password = newPassword;
  await user.save();
  res.status(200).json({ success: true, message: "Password updated successfully." });
});

// PATCH /api/settings/notifications
const updateNotifications = asyncHandler(async (req, res) => {
  const { emailNotifications, smsNotifications, transactionAlerts } = req.body;
  const settings = await Settings.findOneAndUpdate(
    { userId: req.user._id },
    { emailNotifications, smsNotifications, transactionAlerts },
    { new: true }
  );
  res.status(200).json({ success: true, data: settings });
});

// ─── SECURITY CONTROLLER ─────────────────────────────────────

// GET /api/security/limits
const getLimits = asyncHandler(async (req, res) => {
  const security = await Security.findOne({ userId: req.user._id });
  res.status(200).json({
    success: true,
    data: {
      dailyTransferLimit: security.dailyTransferLimit,
      singleTransferLimit: security.singleTransferLimit,
      twoFAEnabled: security.twoFAEnabled,
    },
  });
});

// PATCH /api/security/limits
const updateLimits = asyncHandler(async (req, res) => {
  const { dailyTransferLimit, singleTransferLimit } = req.body;
  const security = await Security.findOneAndUpdate(
    { userId: req.user._id },
    { dailyTransferLimit, singleTransferLimit },
    { new: true }
  );
  res.status(200).json({ success: true, data: security });
});

// ─── ROUTES ──────────────────────────────────────────────────
const settingsRouter = express.Router();
settingsRouter.use(protect);
settingsRouter.get("/profile",          getProfile);
settingsRouter.patch("/profile",        updateProfile);
settingsRouter.patch("/password",       updatePassword);
settingsRouter.patch("/notifications",  updateNotifications);

const securityRouter = express.Router();
securityRouter.use(protect);
securityRouter.get("/limits",    getLimits);
securityRouter.patch("/limits",  updateLimits);

module.exports = { settingsRouter, securityRouter };
