const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth/auth.controller');
const merchantController = require('../controllers/merchant/merchant.controller');
const adminController = require('../controllers/admin/admin.controller');
const profileController = require('../controllers/profile/profile.controller');
const dashboardController = require('../controllers/dashboard/dashboard.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { requireMerchant } = require('../middleware/kyc.middleware');

// Auth routes
router.post('/register', authController.register);
router.post('/verify-registration-otp', authController.verifyRegistrationOtp);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOtpAndLogin);
router.post('/resend-otp', authController.resendOtp);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);
router.post('/refresh', authController.refresh);
router.get('/me', authenticate, authController.me);

// Merchant routes
router.post('/merchant/approval-request', merchantController.submitMerchantApprovalRequest);
router.post('/merchant/approval-status', merchantController.getMerchantApprovalStatus);
router.get('/merchant/onboarding', authenticate, requireMerchant, profileController.getMerchantOnboarding);

// Admin routes
router.get('/admin/merchants/accounts', authenticate, requireAdmin, adminController.getMerchantAccounts);
router.get('/admin/merchants/pending', authenticate, requireAdmin, adminController.getPendingMerchants);
router.get('/admin/merchants/approved', authenticate, requireAdmin, adminController.getApprovedMerchants);
router.get('/admin/merchants/requests', authenticate, requireAdmin, adminController.getMerchantApprovalRequests);
router.get('/admin/merchants/manager', authenticate, requireAdmin, dashboardController.getMerchantManager);
router.get('/admin/merchants/:merchantId', authenticate, requireAdmin, adminController.getMerchantApprovalRequest);
router.patch('/admin/merchants/:merchantId/approve', authenticate, requireAdmin, adminController.approveMerchant);
router.patch('/admin/merchants/:merchantId/reject', authenticate, requireAdmin, adminController.rejectMerchant);

module.exports = router;
