const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const payoutController = require('../controllers/payout/payout.controller');

router.use(authenticate);

router.get('/balance', payoutController.getBalance);
router.get('/transactions', payoutController.listTransactions);
router.get('/ledger', payoutController.listLedger);
router.get('/ip-whitelist', payoutController.listIpWhitelist);

module.exports = router;
