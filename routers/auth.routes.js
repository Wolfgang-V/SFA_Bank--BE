// ════════════════════════════════════════
//  AUTH ROUTES  — /api/auth
// ════════════════════════════════════════
const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, resetPassword, getMe, getUserById } = require("../controllers/auth.controller");
const protect = require("../middleware/auth.middleware");

router.post("/register",        register);
router.post("/login",           login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password",  resetPassword);
router.get("/me",               protect, getMe);  // Protected
router.get("/users/:id",        protect, getUserById);  // Protected - Get user by ID

module.exports = router;
