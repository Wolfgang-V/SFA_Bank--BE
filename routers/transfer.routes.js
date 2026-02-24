const express = require('express');
const TransactionModel = require('../models/transaction.model');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const { Transfer } = require('../controllers/account.controller');

// Apply auth middleware to all transfer routes
router.use(protect);

// POST /api/transfers - Create a new transfer
router.post("/", Transfer);

// GET /api/transfers - Get all transfers for the logged-in user
router.get("/", async (req, res) => {
    try {
        const transfers = await TransactionModel.find({ 
            type: "transfer",
            user: req.user._id
        }).sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: transfers });
    } catch (error) {
        console.error('Error fetching transfers:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch transfers', error: error.message });
    }
});

module.exports = router;
