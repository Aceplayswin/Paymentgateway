const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard/dashboard.controller');

router.use(authenticate);

router.get('/summary', dashboardController.getSummary);

module.exports = router;
