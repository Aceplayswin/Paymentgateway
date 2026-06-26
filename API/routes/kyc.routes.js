const express = require('express');
const router = express.Router();

const kycController = require('../controllers/kyc/kyc.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { requireMerchant } = require('../middleware/kyc.middleware');

router.get('/status', authenticate, requireMerchant, kycController.getStatus);
router.put('/draft', authenticate, requireMerchant, kycController.saveDraft);
router.post('/submit', authenticate, requireMerchant, kycController.submit);

router.get('/admin/requests', authenticate, requireAdmin, kycController.getSubmittedRequests);
router.get('/admin/merchants/:merchantId', authenticate, requireAdmin, kycController.getMerchantKyc);
router.patch(
  '/admin/merchants/:merchantId/approve',
  authenticate,
  requireAdmin,
  kycController.approve
);
router.patch(
  '/admin/merchants/:merchantId/reject',
  authenticate,
  requireAdmin,
  kycController.reject
);

router.get('/files/*storagePath', authenticate, kycController.downloadDocument);

module.exports = router;
