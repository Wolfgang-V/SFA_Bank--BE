const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// ─── GENERATE UNIQUE 10-DIGIT ACCOUNT NUMBER ────────────────
// const generateAccountNumber = () => {
//   // Starts with "22" (SFA Bank prefix) + 8 random digits
//   const prefix = "22";
//   const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
//   return prefix + randomDigits;
// };


const generateAccountNumber = () => {
   const prefix = "22";
    return prefix + crypto.randomInt(10000000, 99999999).toString();
};



// ─── GENERATE UNIQUE TRANSACTION REFERENCE ──────────────────
// e.g. "SFA-TXN-A3F9B2C1D4"
const generateReference = () => {
  return "SFA-TXN-" + crypto.randomBytes(5).toString("hex").toUpperCase();
};

// ─── SIGN JWT TOKEN ─────────────────────────────────────────
const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ─── SEND TOKEN RESPONSE ────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
};

// ─── ASYNC ERROR WRAPPER ────────────────────────────────────
// Wraps async controllers so you don't need try/catch everywhere
// Usage: router.post("/login", asyncHandler(authController.login))
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  generateAccountNumber,
  generateReference,
  signToken,
  sendTokenResponse,
  asyncHandler,
};
