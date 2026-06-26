const express = require('express');
const router = express.Router();

const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { requireApprovedMerchant } = require('../middleware/merchant.middleware');
const paymentController = require('../controllers/payment/payment.controller');
const { GATEWAY_PROVIDERS } = require('../controllers/payment/payment.constants');

const captureRawBody = (req, _res, buf) => {
  req.rawBody = buf.toString('utf8');
};

const webhookMiddleware = express.json({ verify: captureRawBody });

// Razorpay -> us webhook (signature verified against the platform webhook secret).
for (const provider of GATEWAY_PROVIDERS) {
  router.post(`/${provider}/webhook`, webhookMiddleware, (req, res, next) => {
    req.params.provider = provider;
    return paymentController.handleWebhook(req, res, next);
  });
}

// --- Public (unauthenticated) hosted-checkout endpoints ---------------------
// These power the hosted payment page. They are authenticated by per-order
// references (link token / byteTransactionId), not JWT.

// Hosted payment page data (order + Razorpay checkout) for a 5-min link token.
router.get('/pay/:linkToken', paymentController.getHostedPayment);

// Hosted-page payment verification (byteTransactionId + Razorpay signature).
for (const provider of GATEWAY_PROVIDERS) {
  router.post(`/${provider}/payment-verify`, express.json(), (req, res, next) => {
    req.params.provider = provider;
    return paymentController.verifyHostedPayment(req, res, next);
  });
}

router.use(authenticate);

// --- Gateway onboarding (authenticated merchant) ----------------------------
router.post('/razorpay/connect', requireApprovedMerchant, paymentController.razorpayConnect);

router.post('/gateway/connect', requireApprovedMerchant, paymentController.connectGateway);
router.get('/gateway/configs', requireApprovedMerchant, paymentController.listGatewayConfigs);
router.get('/gateway/config', requireApprovedMerchant, paymentController.getGatewayConfig);
router.patch('/gateway/config', requireApprovedMerchant, paymentController.updateGatewayConfig);

router.get(
  '/gateway/configs/:merchantId',
  requireAdmin,
  paymentController.listGatewayConfigs
);

router.get(
  '/gateway/config/:merchantId',
  requireAdmin,
  paymentController.getGatewayConfig
);

// --- Payment collection (authenticated merchant) ----------------------------
for (const provider of GATEWAY_PROVIDERS) {
  router.post(`/${provider}/initiate`, requireApprovedMerchant, (req, res, next) => {
    req.params.provider = provider;
    return paymentController.initiatePayment(req, res, next);
  });

  router.get(
    `/${provider}/status/:merchantOrderId`,
    requireApprovedMerchant,
    (req, res, next) => {
      req.params.provider = provider;
      return paymentController.getOrderStatus(req, res, next);
    }
  );
}

module.exports = router;
