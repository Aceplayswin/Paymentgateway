const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const settingsController = require('../controllers/settings/settings.controller');

router.use(authenticate);

router.get('/ip-whitelist', settingsController.listIpWhitelist);
router.post('/ip-whitelist', settingsController.createIpWhitelist);
router.patch('/ip-whitelist/:id', settingsController.updateIpWhitelist);

module.exports = router;
