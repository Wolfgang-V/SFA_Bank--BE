const express = require('express');
const BankUserModel = require('../models/bankUser.model');
const TransactionModel = require('../models/transaction.model');
const Account = require('../models/account.model');
const router = express.Router();
const { deposit, withdrawal, Transfer, lookupAccount } = require('../controllers/account.controller');
const protect = require('../middleware/auth.middleware');

// Apply auth middleware to all account routes
router.use(protect);

// GET /api/accounts - Get all accounts for the logged-in user
router.get("/", async (req, res) => {
    try {
        console.log("Fetching accounts for user:", req.user._id);
        
        // Always get the latest balance from BankUser
        const bankUser = await BankUserModel.findById(req.user._id);
        console.log("BankUser found:", bankUser ? "Yes, balance: " + bankUser.balance : "No");
        
        // Also check Account model
        let accountDoc = await Account.findOne({ userId: req.user._id });
        
        let accounts = [];
        
        if (bankUser) {
            // Use Account document if it exists, otherwise create from BankUser
            if (accountDoc) {
                // Update the Account document with the latest balance from BankUser
                accountDoc.balance = bankUser.balance;
                await accountDoc.save();
                accounts = [accountDoc];
            } else {
                // Create account data from BankUser
                accounts = [{
                    _id: bankUser._id,
                    userId: bankUser._id,
                    accountNumber: bankUser.accountNumber,
                    accountType: "savings",
                    balance: bankUser.balance,
                    currency: "NGN",
                    status: "active",
                    createdAt: bankUser.createdAt,
                    updatedAt: bankUser.updatedAt
                }];
            }
        }
        
        console.log("Returning accounts:", accounts);
        return res.status(200).json({ success: true, data: accounts });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch accounts', error: error.message });
    }
});

// Lookup endpoint - for checking recipient before transfer (MUST be before /:id to avoid route conflict)
router.get("/lookup/:accountNumber", lookupAccount);

// GET /api/accounts/:id - Get a specific account by ID
router.get("/:id", async (req, res) => {
    try {
        const account = await Account.findOne({ _id: req.params.id, userId: req.user._id });
        if (!account) {
            // Try to get from BankUser if not found in Account
            const bankUser = await BankUserModel.findById(req.params.id);
            if (bankUser && bankUser._id.toString() === req.user._id.toString()) {
                return res.status(200).json({ 
                    success: true, 
                    data: {
                        _id: bankUser._id,
                        userId: bankUser._id,
                        accountNumber: bankUser.accountNumber,
                        accountType: "savings",
                        balance: bankUser.balance,
                        currency: "NGN",
                        status: "active",
                        createdAt: bankUser.createdAt,
                        updatedAt: bankUser.updatedAt
                    }
                });
            }
            return res.status(404).json({ success: false, message: "Account not found" });
        }
        
        // Get latest balance from BankUser
        const bankUser = await BankUserModel.findById(req.user._id);
        if (bankUser) {
            account.balance = bankUser.balance;
        }
        
        return res.status(200).json({ success: true, data: account });
    } catch (error) {
        console.error('Error fetching account:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch account', error: error.message });
    }
});

// GET /api/accounts/:id/transactions - Get transactions for a specific account
router.get("/:id/transactions", async (req, res) => {
    try {
        const account = await Account.findOne({ _id: req.params.id, userId: req.user._id });
        
        let accountNumber;
        if (!account) {
            // Try to get from BankUser
            const bankUser = await BankUserModel.findById(req.params.id);
            if (!bankUser || bankUser._id.toString() !== req.user._id.toString()) {
                return res.status(404).json({ success: false, message: "Account not found" });
            }
            accountNumber = bankUser.accountNumber;
        } else {
            accountNumber = account.accountNumber;
        }

        const transactions = await TransactionModel.find({
            $or: [
                { senderAccount: accountNumber },
                { receiverAccount: accountNumber }
            ]
        }).sort({ createdAt: -1 });

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
