const express = require('express');
const BankUserModel = require('../models/bankUser.model');
const TransactionModel = require('../models/transaction.model');
const { getTransactions } = require('../controllers/transaction.controller');
const router = express.Router();
const protect = require('../middleware/auth.middleware');

// Apply auth middleware
router.use(protect);

// GET /api/transactions - Get all transactions for logged-in user
router.get("/", getTransactions)

module.exports = router;
