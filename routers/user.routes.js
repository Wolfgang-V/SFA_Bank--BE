const express = require('express');
const { createBankUser, login, setPin, verifyPin } = require('../controllers/bankUser.controller');
const router = express.Router();
const protect = require('../middleware/auth.middleware');

router.post("/register", createBankUser)
router.post("/login", login)

// PIN routes - require authentication
router.post("/pin", protect, setPin)
router.post("/pin/verify", protect, verifyPin)

module.exports = router;
