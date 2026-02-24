// ─── BILLER CONTROLLER ───────────────────────────────────────
const { Biller, Payment } = require("../models/other.model");
const Account = require("../models/account.model");
const Transaction = require("../models/transaction.model");
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
  const { accountNumber, billerId, amount, customerReference } = req.body;

  if (!accountNumber || !billerId || !amount) {
    return res.status(400).json({
      success: false,
      message: "Account number, biller, and amount are required.",
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

  const biller = await Biller.findById(billerId);
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
