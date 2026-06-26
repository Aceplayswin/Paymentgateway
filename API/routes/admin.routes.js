const express = require('express');
const router = express.Router();

const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const platformGatewayController = require('../controllers/admin/platformGateway.controller');

router.use(authenticate);
router.use(requireAdmin);

// Platform acquiring gateways. Credentials live in the environment; the admin
// only lists connected gateways and chooses which one is active.
router.get('/gateway', platformGatewayController.listGateways);
router.patch('/gateway/status', platformGatewayController.setStatus);

module.exports = router;
