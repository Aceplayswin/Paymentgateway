const paymentService = require('./payment.service');

const sendResult = (res, result) =>
  res.status(result.statusCode || 200).json({
    success: result.success,
    message: result.message,
    ...(result.data !== undefined ? { data: result.data } : {})
  });

exports.connectGateway = async (req, res) => {
  try {
    const result = await paymentService.connectGateway(req, req.body);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGatewayConfig = async (req, res) => {
  try {
    const result = await paymentService.getGatewayConfig(
      req,
      req.params.merchantId,
      req.query.gatewayProvider
    );
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.listGatewayConfigs = async (req, res) => {
  try {
    const result = await paymentService.listGatewayConfigs(req, req.params.merchantId);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGatewayConfig = async (req, res) => {
  try {
    const result = await paymentService.updateGatewayConfig(req, req.body);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.initiatePayment = async (req, res) => {
  try {
    const provider = req.params.provider || req.body.gatewayProvider;
    const result = await paymentService.initiatePayment(req, provider, req.body);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderStatus = async (req, res) => {
  try {
    const provider = req.params.provider;
    const result = await paymentService.getOrderStatus(req, provider, req.params.merchantOrderId);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const authorization =
      req.headers.authorization || req.headers.Authorization || '';
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const provider = req.params.provider;
    const signature = req.headers['x-razorpay-signature'];
    const result = await paymentService.handleWebhook(provider, authorization, rawBody, {
      signature
    });
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Razorpay onboarding ----------------------------------------------------

exports.razorpayConnect = async (req, res) => {
  try {
    const result = await paymentService.connectRazorpay(req, req.body);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Public (unauthenticated) endpoints -------------------------------------

// Hosted payment page data (order + Razorpay checkout payload) for a link token.
exports.getHostedPayment = async (req, res) => {
  try {
    const result = await paymentService.getHostedPayment(req.params.linkToken);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Customer-facing verify from the hosted payment page (Razorpay checkout signature).
exports.verifyHostedPayment = async (req, res) => {
  try {
    const provider = req.params.provider;
    const byteTransactionId =
      req.body.TransactionId || req.body.byteTransactionId || req.body.byte_order_status;
    const result = await paymentService.verifyHostedPayment(provider, {
      byteTransactionId,
      razorpayOrderId:
        req.body.razorpay_order_id || req.body.razorpayOrderId || req.body.order_id,
      razorpayPaymentId:
        req.body.razorpay_payment_id || req.body.razorpayPaymentId || req.body.payment_id,
      razorpaySignature:
        req.body.razorpay_signature || req.body.razorpaySignature || req.body.signature
    });
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
