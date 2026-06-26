const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware'); 
const transactionController = require('../controllers/transaction.controller');

router.use(authenticate);

router.get('/payin', transactionController.listPayinTransactions);
router.get('/payin/:transactionId', transactionController.getPayinTransaction);
router.post('/payin', transactionController.createPayinTransaction);
router.patch('/payin/:transactionId', transactionController.updatePayinTransaction);

router.get('/payout', transactionController.listPayoutTransactions);
router.get('/payout/:payoutId', transactionController.getPayoutTransaction);
router.post('/payout', transactionController.createPayoutTransaction);
router.patch('/payout/:payoutId', transactionController.updatePayoutTransaction);

router.get('/settlements', transactionController.listSettlements);
router.get('/settlements/:settlementId', transactionController.getSettlement);
router.post('/settlements', transactionController.createSettlement);

router.get('/ledger', transactionController.listLedgerEntries);
router.post('/ledger', transactionController.createLedgerEntry);

router.get('/disputes', transactionController.listDisputes);
router.post('/disputes', transactionController.createDispute);

module.exports = router;
