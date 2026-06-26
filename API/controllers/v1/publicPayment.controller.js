const paymentService = require('../payment/payment.service');

// Public payment API (/api/v1/*) for merchant server-to-server integration.
// Authenticated by API key + HMAC (apiKey.middleware). Responses expose ONLY our
// own identifiers and the hosted payment URL — never Razorpay keys/order ids.

const PROVIDER = 'razorpay';

// Maps an internal payin status to the public API vocabulary.
const toPublicStatus = (status) => {
  switch (status) {
    case 'success':
      return 'paid';
    case 'failed':
      return 'failed';
    case 'refunded':
      return 'refunded';
    default:
      return 'created';
  }
};

// POST /api/v1/payment/orders
// Body: { amount, currency?, customerName, customerPhone?, orderId?, redirectUrl?,
//         remark1?, remark2? }
exports.createOrder = async (req, res) => {
  try {
    const result = await paymentService.initiatePayment(req, PROVIDER, req.body);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message
      });
    }

    const d = result.data || {};
    // Whitelist our own fields only — Razorpay ids/keys are intentionally omitted.
    return res.status(201).json({
      success: true,
      message: 'Order created',
      data: {
        orderId: d.merchantOrderId,
        referenceId: d.byteTransactionId,
        amount: d.amount,
        currency: d.currency || 'INR',
        status: 'created',
        paymentUrl: d.paymentUrl,
        customerName: d.customerName,
        customerPhone: d.customerPhone
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/payment/orders/:orderId
exports.getOrderStatus = async (req, res) => {
  try {
    const result = await paymentService.getOrderStatus(req, PROVIDER, req.params.orderId);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message
      });
    }

    const d = result.data || {};
    return res.status(200).json({
      success: true,
      message: result.message || 'OK',
      data: {
        orderId: d.merchantOrderId,
        referenceId: d.byteTransactionId,
        status: toPublicStatus(d.status),
        utr: d.utr || null
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
