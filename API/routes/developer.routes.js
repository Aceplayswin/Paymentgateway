const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { requireApprovedMerchant } = require('../middleware/merchant.middleware');
const apiKeyController = require('../controllers/developer/apiKey.controller');

router.use(authenticate);
router.use(requireApprovedMerchant);

// API key management (dashboard).
router.get('/api-keys', apiKeyController.listKeys);
router.post('/api-keys/generate', apiKeyController.generateKey);
router.post('/api-keys/revoke', apiKeyController.revokeKey);

module.exports = router;
