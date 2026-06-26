const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const payinController = require('../controllers/payin/payin.controller');

router.use(authenticate);

router.get('/summary', payinController.getSummary);
router.get('/sales-report', payinController.getSalesReport);
router.get('/merchant-report', payinController.getMerchantReport);
router.get('/reports', payinController.getReports);
router.get('/refund-callbacks', payinController.listRefundCallbacks);
router.get('/chargebacks-liens', payinController.listChargebacksLiens);
router.get('/complaints', payinController.listComplaints);
router.get('/transactions', payinController.listTransactions);
router.get('/settlements', payinController.listSettlements);

module.exports = router;
