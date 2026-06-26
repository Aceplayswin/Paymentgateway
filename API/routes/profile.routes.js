const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const profileController = require('../controllers/profile/profile.controller');

router.use(authenticate);

router.get('/', profileController.getProfile);
router.patch('/', profileController.updateProfile);

module.exports = router;
