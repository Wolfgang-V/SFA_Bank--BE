// ─── BILLER CONTROLLER ───────────────────────────────────────
const { Biller, Payment } = require("../models/other.model");
const Account = require("../models/account.model");
const Transaction = require("../models/transaction.model");
const BankUser = require("../models/bankUser.model");
const { generateReference, asyncHandler } = require("../models/utils/helper");

// GET /api/billers — Get all active billers
const getBillers = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;

  const billers = await Biller.find(filter).sort({ billerName: 1 });
  res.status(200).json({ success: true, data: billers });
});

// GET /api/billers/:id
const getBiller = asyncHandler(async (req, res) => {
  const biller = await Biller.findById(req.params.id);
  if (!biller) {
    return res.status(404).json({ success: false, message: "Biller not found." });
  }
  res.status(200).json({ success: true, data: biller });
});

// POST /api/payments — Pay a bill
const payBill = asyncHandler(async (req, res) => {
  const { accountNumber, billerId, billerCode, amount, customerReference, pin } = req.body;

  // Validate PIN
  if (!pin) {
    return res.status(400).json({
      success: false,
      message: "Transaction PIN is required",
      requiresPin: true
    });
  }

  if (!accountNumber || !amount) {
    return res.status(400).json({
      success: false,
      message: "Account number and amount are required.",
    });
  }

  if (!billerId && !billerCode) {
    return res.status(400).json({
      success: false,
      message: "Biller information is required.",
    });
  }

  // Find user with transactionPin included
  const user = await BankUser.findById(req.user._id).select("+transactionPin");

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Verify transaction PIN
  if (!user.transactionPin) {
    return res.status(400).json({
      success: false,
      message: "Transaction PIN not set. Please set up your PIN first.",
      requiresPinSetup: true
    });
  }

  const isPinValid = await user.compareTransactionPin(pin);
  if (!isPinValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid transaction PIN"
    });
  }

  // Find user's account
  const account = await Account.findOne({
    accountNumber,
    userId: req.user._id,
    status: "active",
  });

  if (!account) {
    return res.status(404).json({ success: false, message: "Account not found." });
  }

  if (account.balance < Number(amount)) {
    return res.status(400).json({ success: false, message: "Insufficient balance." });
  }

  // Find biller - try by _id first, then by billerCode
  let biller = null;
  
  // Check if billerId is a valid MongoDB ObjectId
  const mongoose = require("mongoose");
  const isValidObjectId = mongoose.Types.ObjectId.isValid(billerId);
  
  if (billerId && isValidObjectId) {
    biller = await Biller.findById(billerId);
  }
  
  // If not found by _id, try by billerCode
  if (!biller && billerCode) {
    biller = await Biller.findOne({ billerCode: billerCode.toUpperCase() });
  }
  
  // If still not found, try by billerId as a fallback (for frontend string IDs)
  if (!biller && billerId) {
    biller = await Biller.findOne({ 
      $or: [
        { billerCode: billerId.toUpperCase() },
        { _id: billerId }
      ]
    });
  }

  if (!biller) {
    return res.status(404).json({ success: false, message: "Biller not found." });
  }

  const reference = generateReference();

  // Create transaction record with correct field names matching transaction model
  const transaction = await Transaction.create({
    user: req.user._id,
    reference: reference,
    type: "bill_payment",
    amount: Number(amount),
    senderAccount: account.accountNumber,
    receiverAccount: biller.billerName,
    description: `Bill payment to ${biller.billerName}`,
    status: "success",
  });

  // Deduct from account
  account.balance -= Number(amount);
  await account.save();

  // Create payment record
  const payment = await Payment.create({
    accountId: account._id,
    billerId: biller._id,
    transactionId: transaction._id,
    amount: Number(amount),
    customerReference,
    status: "successful",
    completedAt: new Date(),
  });

  res.status(200).json({
    success: true,
    message: `Payment to ${biller.billerName} successful!`,
    data: {
      reference: reference,
      amount: Number(amount),
      newBalance: account.balance,
      paymentId: payment._id,
    },
  });
});

// GET /api/payments — Payment history
const getPayments = asyncHandler(async (req, res) => {
  const userAccounts = await Account.find({ userId: req.user._id }).select("_id");
  const accountIds = userAccounts.map((a) => a._id);

  const payments = await Payment.find({ accountId: { $in: accountIds } })
    .sort({ createdAt: -1 })
    .populate("billerId", "billerName category")
    .populate("transactionId", "reference status");

  res.status(200).json({ success: true, data: payments });
});

module.exports = { getBillers, getBiller, payBill, getPayments };
