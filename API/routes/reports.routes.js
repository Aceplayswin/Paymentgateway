const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const reportsController = require('../controllers/reports/reports.controller');

router.use(authenticate);

router.get('/center', reportsController.getCenter);
router.get('/sales', reportsController.getSales);
router.get('/merchant', reportsController.getMerchant);
router.get('/summary', reportsController.getSummary);

module.exports = router;
