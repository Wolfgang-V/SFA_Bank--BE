// ════════════════════════════════════════
//  AUTH ROUTES  — /api/auth
// ════════════════════════════════════════
const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, getMe } = require("../controllers/auth.controller");
const protect = require("../middleware/auth.middleware");

router.post("/register",        register);
router.post("/login",           login);
router.post("/forgot-password", forgotPassword);
router.get("/me",               protect, getMe);  // Protected

module.exports = router;
