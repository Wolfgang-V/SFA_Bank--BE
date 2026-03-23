const express = require('express');
const BankUserModel = require('../models/bankUser.model');
const TransactionModel = require('../models/transaction.model');
const Account = require('../models/account.model');
const router = express.Router();
const { deposit, withdrawal, Transfer, lookupAccount } = require('../controllers/account.controller');
const protect = require('../middleware/auth.middleware');

// Apply auth middleware to all account routes
router.use(protect);

// GET /api/accounts - Get account for logged-in user (BankUser canonical)
router.get("/", async (req, res) => {
    try {
        const bankUser = await BankUserModel.findById(req.user._id).select('-password -transactionPin');
        
        if (!bankUser) {
            return res.status(404).json({ success: false, message: "User account not found" });
        }

        const accountData = {
            _id: bankUser._id,
            userId: bankUser._id,
            accountNumber: bankUser.accountNumber,
            accountType: "savings",
            balance: bankUser.balance,
            currency: "NGN",
            status: "active"
        };

        return res.status(200).json({ success: true, data: [accountData] });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch accounts', error: error.message });
    }
});

// Lookup endpoint - for checking recipient before transfer (MUST be before /:id to avoid route conflict)
router.get("/lookup/:accountNumber", lookupAccount);

// GET /api/accounts/:id - Get account (BankUser canonical)
router.get("/:id", async (req, res) => {
    try {
        if (req.params.id !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const bankUser = await BankUserModel.findById(req.user._id).select('-password -transactionPin');
        
        if (!bankUser) {
            return res.status(404).json({ success: false, message: "Account not found" });
        }

        const accountData = {
            _id: bankUser._id,
            userId: bankUser._id,
            accountNumber: bankUser.accountNumber,
            accountType: "savings",
            balance: bankUser.balance,
            currency: "NGN",
            status: "active"
        };

        return res.status(200).json({ success: true, data: accountData });
    } catch (error) {
        console.error('Error fetching account:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch account', error: error.message });
    }
});

// GET /api/accounts/:id/transactions - Get transactions for a specific account
router.get("/:id/transactions", async (req, res) => {
    try {
        console.log("Fetching transactions for account ID:", req.params.id);
        console.log("User ID from token:", req.user._id);
        
        const account = await Account.findOne({ _id: req.params.id, userId: req.user._id });
        
        console.log("Found account:", account);
        
        let accountNumber;
        if (!account) {
            // Try to get from BankUser
            const bankUser = await BankUserModel.findById(req.params.id);
            console.log("Found bankUser:", bankUser);
            if (!bankUser || bankUser._id.toString() !== req.user._id.toString()) {
                return res.status(404).json({ success: false, message: "Account not found" });
            }
            accountNumber = bankUser.accountNumber;
        } else {
            accountNumber = account.accountNumber;
        }

        console.log("Searching transactions for account number:", accountNumber);

        const transactions = await TransactionModel.find({
            $or: [
                { senderAccount: accountNumber },
                { receiverAccount: accountNumber }
            ]
        }).sort({ createdAt: -1 });

        console.log("Found transactions count:", transactions.length);

        return res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        console.error('Error fetching account transactions:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
    }
});

router.post("/deposit", deposit)

router.post("/withdraw", withdrawal)

router.post("/transfer", Transfer)

module.exports = router;
