// ─── biller.routes.js ────────────────────────────────────────
const express = require("express");
const protect = require("../middleware/auth.middleware");
const { getBillers, getBiller } = require("../controllers/biller.controller");

const billerRouter = express.Router();
billerRouter.use(protect);
billerRouter.get("/",    getBillers);
billerRouter.get("/:id", getBiller);

module.exports = billerRouter;
