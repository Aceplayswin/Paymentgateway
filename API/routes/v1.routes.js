const express = require('express');
const router = express.Router();

const { requireApiKey } = require('../middleware/apiKey.middleware');
const publicPayment = require('../controllers/v1/publicPayment.controller');

// Capture the raw request body so the HMAC signature can be verified over the
// exact bytes the merchant signed.
const captureRawBody = (req, _res, buf) => {
  req.rawBody = buf.length ? buf.toString('utf8') : '';
};

router.use(express.json({ verify: captureRawBody }));
router.use(requireApiKey);

// --- Payments ---------------------------------------------------------------
router.post('/payment/orders', publicPayment.createOrder);
router.get('/payment/orders/:orderId', publicPayment.getOrderStatus);

module.exports = router;
