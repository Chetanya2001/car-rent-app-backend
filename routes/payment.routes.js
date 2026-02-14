const express = require("express");
const router = express.Router();
const {
  createOrder,
  zeroPaymentConfirm,
  verifyPayment,
  getMyPayments,
} = require("../controller/payment.controller");

const { verifyToken, checkRole } = require("../middleware/authmiddleware");

router.post("/payments/create-order", verifyToken, createOrder);
router.post("/payments/verify", verifyToken, verifyPayment);
router.post("/payments/zero-confirm", verifyToken, zeroPaymentConfirm);
router.get("/payments/mypayments", verifyToken, getMyPayments);

module.exports = router;
