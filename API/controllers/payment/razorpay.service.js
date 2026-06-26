// Razorpay gateway — official PG integration via Orders API + Checkout.
//
// Flow:
//   Connect:  merchant stores key_id + key_secret (+ optional webhook secret).
//   Collect:  initiatePayment creates a Razorpay order and returns checkout payload.
//   Verify:   payment signature on callback, status poll, or signed webhook.

const PayinTransaction = require('../../models/payinTransaction.model');
const platformAccount = require('./providers/razorpay/platformAccount');
const { createOrder } = require('./providers/collect');
const { fireMerchantWebhook } = require('./providers/merchantWebhook');
const { validatePaymentInput } = require('./payment.shared');
const {
  createClient,
  getKeyId,
  getKeySecret,
  getWebhookSecret,
  verifyPaymentSignature,
  verifyWebhookSignature
} = require('./providers/razorpay/client');

const PROVIDER = 'razorpay';

const getCallbackUrl = (config) => config?.providerConfig?.callbackUrl || null;

const buildCheckoutPayload = (config, transaction, razorpayOrder) => ({
  key: getKeyId(config),
  order_id: razorpayOrder.id,
  amount: razorpayOrder.amount,
  currency: razorpayOrder.currency || 'INR',
  name: config.merchantName,
  description: transaction.remark1 || `Payment for ${transaction.orderId}`,
  prefill: {
    name: transaction.customerName,
    contact: transaction.customerPhone
  },
  notes: {
    merchantOrderId: transaction.orderId,
    byteTransactionId: transaction.byteTransactionId
  }
});

// Credentials are managed centrally by Admin on the single platform account
// (controllers/admin/platformGateway.*). See providers/razorpay/platformAccount
// for how the payment flows resolve them.

// --- collect ----------------------------------------------------------------

const initiatePayment = async (req, body, config) => {
  const validated = validatePaymentInput(body);
  if (validated.error) return validated.error;

  const order = await createOrder({
    req,
    body,
    provider: PROVIDER,
    validated,
    config,
    gatewayOrderId: null
  });

  let razorpayOrder;
  try {
    const client = createClient(config);
    razorpayOrder = await client.orders.create({
      amount: validated.amountPaise,
      currency: 'INR',
      receipt: order.merchantOrderId,
      notes: {
        merchantOrderId: order.merchantOrderId,
        byteTransactionId: order.byteTransactionId,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone
      }
    });
  } catch (error) {
    return {
      statusCode: 502,
      success: false,
      message: error.error?.description || error.message || 'Failed to create Razorpay order'
    };
  }

  await PayinTransaction.update(order.transactionId, {
    gatewayOrderId: razorpayOrder.id,
    gatewayState: razorpayOrder.status || 'created'
  });

  const transaction = await PayinTransaction.findById(order.transactionId);
  const checkout = buildCheckoutPayload(config, transaction, razorpayOrder);

  return {
    statusCode: 201,
    success: true,
    message: 'Razorpay order created.',
    data: {
      gatewayProvider: PROVIDER,
      transactionId: order.transactionId,
      merchantOrderId: order.merchantOrderId,
      byteTransactionId: order.byteTransactionId,
      razorpayOrderId: razorpayOrder.id,
      paymentUrl: order.paymentUrl,
      checkout,
      customerName: validated.customerName,
      customerPhone: validated.customerPhone,
      amount: validated.amountInr,
      currency: 'INR',
      state: 'PENDING'
    }
  };
};

// --- verify -----------------------------------------------------------------

const fetchCapturedPayment = async (config, razorpayOrderId) => {
  const client = createClient(config);
  const order = await client.orders.fetch(razorpayOrderId);

  if (order.status !== 'paid') {
    return { confirmed: false, pending: true, state: order.status };
  }

  const payments = await client.orders.fetchPayments(razorpayOrderId);
  const captured =
    payments.items?.find((p) => p.status === 'captured') || payments.items?.[0] || null;

  if (!captured) {
    return { confirmed: false, pending: true, state: order.status };
  }

  return {
    confirmed: true,
    state: captured.status,
    utr: captured.acquirer_data?.rrn || captured.acquirer_data?.upi_transaction_id || null,
    gatewayTxnId: captured.id,
    method: captured.method
  };
};

const finalizeSuccess = async (config, transaction, confirmation) => {
  const updated = await PayinTransaction.update(transaction.transactionId, {
    status: 'success',
    gatewayState: confirmation.state || 'captured',
    utr: confirmation.utr || transaction.utr,
    gatewayOrderId: transaction.gatewayOrderId,
    paymentMethod: confirmation.method || transaction.paymentMethod || PROVIDER
  });

  await fireMerchantWebhook(getCallbackUrl(config), {
    orderId: transaction.orderId,
    status: 'SUCCESS',
    remark1: transaction.remark1,
    utr: confirmation.utr
  });

  return updated;
};

const finalizeFailed = async (transaction, confirmation) =>
  PayinTransaction.update(transaction.transactionId, {
    status: 'failed',
    gatewayState: confirmation.state || 'failed',
    paymentMethod: confirmation.method || transaction.paymentMethod || PROVIDER
  });

const buildStatusResponse = (transaction, state, note) => ({
  statusCode: 200,
  success: true,
  message: state === 'success' ? 'Payment confirmed.' : note || 'Payment pending.',
  data: {
    gatewayProvider: PROVIDER,
    merchantOrderId: transaction.orderId,
    byteTransactionId: transaction.byteTransactionId,
    razorpayOrderId: transaction.gatewayOrderId,
    status: transaction.status,
    gatewayState: transaction.gatewayState,
    utr: transaction.utr || null
  }
});

const confirmFromRazorpay = async (config, transaction) => {
  if (!transaction.gatewayOrderId) {
    return { confirmed: false, message: 'Razorpay order id missing' };
  }

  try {
    const confirmation = await fetchCapturedPayment(config, transaction.gatewayOrderId);
    if (confirmation.confirmed && Number(transaction.amount) > 0) {
      const client = createClient(config);
      const order = await client.orders.fetch(transaction.gatewayOrderId);
      const expectedPaise = Math.round(Number(transaction.amount) * 100);
      if (Number(order.amount) !== expectedPaise) {
        return { confirmed: false, amountMismatch: true };
      }
    }
    return confirmation;
  } catch (error) {
    return {
      confirmed: false,
      message: error.error?.description || error.message || 'Failed to reach Razorpay'
    };
  }
};

const getOrderStatus = async (req, merchantOrderId, config) => {
  const filterUserId = req.user.role === 'merchant' ? req.user.id : undefined;
  const transaction = await PayinTransaction.findByOrderId({
    orderId: merchantOrderId,
    userId: filterUserId
  });
  if (!transaction) {
    return { statusCode: 404, success: false, message: 'Order not found' };
  }
  if (transaction.status === 'success') {
    return buildStatusResponse(transaction, 'success');
  }
  if (transaction.status === 'failed') {
    return buildStatusResponse(transaction, 'failed', 'Payment failed.');
  }

  const confirmation = await confirmFromRazorpay(config, transaction);
  if (confirmation.amountMismatch) {
    return { statusCode: 400, success: false, message: 'Amount not matched.' };
  }
  if (!confirmation.confirmed) {
    return buildStatusResponse(transaction, 'pending', confirmation.message);
  }

  const updated = await finalizeSuccess(config, transaction, confirmation);
  return buildStatusResponse(updated, 'success');
};

const verifyByPaymentSignature = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  byteTransactionId
}) => {
  let transaction = null;

  if (byteTransactionId) {
    transaction = await PayinTransaction.findByByteTransactionId(byteTransactionId);
  }
  if (!transaction && razorpayOrderId) {
    transaction = await PayinTransaction.findByGatewayOrderId(razorpayOrderId);
  }
  if (!transaction) {
    return { statusCode: 404, success: false, message: 'Transaction not found' };
  }
  if (transaction.status === 'success') {
    return {
      statusCode: 200,
      success: true,
      data: { status: 'success', redirectUrl: transaction.redirectUrl }
    };
  }

  const config = await platformAccount.resolveForMerchant(transaction.userId);
  if (!config) {
    return { statusCode: 404, success: false, message: 'Gateway not configured' };
  }

  const orderId = razorpayOrderId || transaction.gatewayOrderId;
  const valid = verifyPaymentSignature(
    { orderId, paymentId: razorpayPaymentId, signature: razorpaySignature },
    getKeySecret(config)
  );
  if (!valid) {
    return { statusCode: 400, success: false, message: 'Invalid payment signature' };
  }

  const confirmation = {
    confirmed: true,
    state: 'captured',
    gatewayTxnId: razorpayPaymentId,
    utr: null
  };

  await finalizeSuccess(config, transaction, confirmation);
  return {
    statusCode: 200,
    success: true,
    data: { status: 'success', redirectUrl: transaction.redirectUrl }
  };
};

const verifyByByteTransactionId = async (byteTransactionId, paymentFields = {}) => {
  if (
    paymentFields.razorpayPaymentId &&
    paymentFields.razorpayOrderId &&
    paymentFields.razorpaySignature
  ) {
    return verifyByPaymentSignature({
      byteTransactionId,
      razorpayOrderId: paymentFields.razorpayOrderId,
      razorpayPaymentId: paymentFields.razorpayPaymentId,
      razorpaySignature: paymentFields.razorpaySignature
    });
  }

  const transaction = await PayinTransaction.findByByteTransactionId(byteTransactionId);
  if (!transaction) {
    return { statusCode: 404, success: false, message: 'Transaction not found' };
  }
  if (transaction.status === 'success') {
    return {
      statusCode: 200,
      success: true,
      data: { status: 'success', redirectUrl: transaction.redirectUrl }
    };
  }

  const config = await platformAccount.resolveForMerchant(transaction.userId);
  if (!config) {
    return { statusCode: 404, success: false, message: 'Gateway not configured' };
  }

  const confirmation = await confirmFromRazorpay(config, transaction);
  if (confirmation.amountMismatch) {
    return { statusCode: 400, success: false, message: 'Amount not matched' };
  }
  if (!confirmation.confirmed) {
    return {
      statusCode: 200,
      success: true,
      data: { status: 'pending', redirectUrl: transaction.redirectUrl }
    };
  }

  await finalizeSuccess(config, transaction, confirmation);
  return {
    statusCode: 200,
    success: true,
    data: { status: 'success', redirectUrl: transaction.redirectUrl }
  };
};

const getHostedCheckout = (config, transaction) => {
  if (!transaction.gatewayOrderId) {
    return null;
  }
  return buildCheckoutPayload(config, transaction, {
    id: transaction.gatewayOrderId,
    amount: Math.round(Number(transaction.amount) * 100),
    currency: 'INR'
  });
};

// --- webhook ----------------------------------------------------------------

const processWebhookEvent = async (event, payload) => {
  const entity = payload?.payment?.entity || payload?.order?.entity || payload?.entity;
  const razorpayOrderId =
    entity?.order_id || payload?.order?.entity?.id || payload?.payment?.entity?.order_id;
  if (!razorpayOrderId) {
    return { statusCode: 200, success: true, message: 'Razorpay webhook ignored (no order)' };
  }

  const transaction = await PayinTransaction.findByGatewayOrderId(razorpayOrderId);
  if (!transaction) {
    return { statusCode: 200, success: true, message: 'Razorpay webhook ignored (unknown order)' };
  }

  const config = await platformAccount.resolveForMerchant(transaction.userId);
  if (!config) {
    return { statusCode: 200, success: true, message: 'Razorpay webhook ignored (no config)' };
  }

  if (event === 'payment.captured' || event === 'order.paid') {
    if (transaction.status === 'success') {
      return { statusCode: 200, success: true, message: 'Payment already confirmed' };
    }
    const payment = payload?.payment?.entity;
    await finalizeSuccess(config, transaction, {
      confirmed: true,
      state: payment?.status || 'captured',
      utr: payment?.acquirer_data?.rrn || payment?.acquirer_data?.upi_transaction_id || null,
      gatewayTxnId: payment?.id,
      method: payment?.method
    });
    return { statusCode: 200, success: true, message: 'Payment captured via webhook' };
  }

  if (event === 'payment.failed') {
    const payment = payload?.payment?.entity;
    await finalizeFailed(transaction, {
      state: payment?.status || 'failed',
      method: payment?.method
    });
    return { statusCode: 200, success: true, message: 'Payment failure recorded' };
  }

  return { statusCode: 200, success: true, message: `Razorpay webhook ignored (${event})` };
};

const handleWebhook = async (authorizationHeader, rawBody, signatureHeader) => {
  let parsed;
  try {
    parsed = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  } catch {
    return { statusCode: 400, success: false, message: 'Invalid JSON body' };
  }

  const signature =
    signatureHeader ||
    (authorizationHeader && authorizationHeader.startsWith('Bearer ')
      ? authorizationHeader.slice(7)
      : authorizationHeader);

  // The webhook secret lives on the single platform account (same for every
  // merchant). Resolve it via the order's merchant only as a legacy fallback.
  const razorpayOrderId =
    parsed?.payload?.payment?.entity?.order_id || parsed?.payload?.order?.entity?.id;
  let config = await platformAccount.resolveForMerchant(null);
  if (!config && razorpayOrderId) {
    const transaction = await PayinTransaction.findByGatewayOrderId(razorpayOrderId);
    if (transaction) {
      config = await platformAccount.resolveForMerchant(transaction.userId);
    }
  }

  const webhookSecret = config ? getWebhookSecret(config) : null;
  if (webhookSecret) {
    const raw = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    if (!verifyWebhookSignature(raw, signature, webhookSecret)) {
      return { statusCode: 400, success: false, message: 'Invalid webhook signature' };
    }
  }

  const event = parsed?.event;
  const payload = parsed?.payload;
  if (!event || !payload) {
    return { statusCode: 400, success: false, message: 'Invalid Razorpay webhook payload' };
  }

  return processWebhookEvent(event, payload);
};

module.exports = {
  PROVIDER,
  initiatePayment,
  getOrderStatus,
  verifyByByteTransactionId,
  verifyByPaymentSignature,
  getHostedCheckout,
  handleWebhook
};
