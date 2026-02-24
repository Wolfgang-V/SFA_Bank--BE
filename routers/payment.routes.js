const express = require("express");
const protect = require("../middleware/auth.middleware");
const { payBill, getPayments } = require("../controllers/biller.controller");

const router = express.Router();
router.use(protect);

router.post("/", payBill);
router.get("/", getPayments);

module.exports = router;
