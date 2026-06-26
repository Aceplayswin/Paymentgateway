const { randomUUID } = require('crypto');

const PayinTransaction = require('../../../models/payinTransaction.model');
const PaymentLink = require('../../../models/paymentLink.model');
const { generatePayinTransactionId } = require('../../../utils/transactionFormat');

// Shared order-creation ("create order" / payment-link) flow. Orders are created
// with a unique byteTransactionId (the gateway match reference) and a 5-minute
// hosted-payment-page link.

const PUBLIC_BASE_URL = () =>
  process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || '';

// PHP: "BYTE" . rand(1111,9999) . time()
const generateByteTransactionId = () =>
  `BYTE${Math.floor(1000 + Math.random() * 9000)}${Date.now()}`;

const resolveCollectUserId = (req, body) =>
  req.user.role === 'merchant' ? req.user.id : body.merchantId || req.user.id;

// Creates the payin transaction + payment link and returns the order context.
// `provider`        - gateway key (razorpay)
// `validated`       - output of validatePaymentInput
// `config`          - merchant gateway config
// `gatewayOrderId`  - optional provider-side reference (set after order creation)
const createOrder = async ({ req, body, provider, validated, config, gatewayOrderId = null }) => {
  const { customerName, customerPhone, amountInr } = validated;
  const userId = resolveCollectUserId(req, body);
  const byteTransactionId = generateByteTransactionId();
  const merchantOrderId =
    body.orderId
      ? String(body.orderId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 63)
      : `${provider.toUpperCase()}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const transactionId = generatePayinTransactionId();

  await PayinTransaction.create({
    transactionId,
    orderId: merchantOrderId,
    customerName,
    customerPhone,
    gatewayProvider: provider,
    gatewayOrderId,
    byteTransactionId,
    redirectUrl: body.redirectUrl || config.redirectUrl || null,
    remark1: body.remark1 || null,
    remark2: body.remark2 || null,
    amount: amountInr,
    paymentMethod: provider,
    status: 'pending',
    gatewayState: 'PENDING',
    userId
  });

  const { linkToken } = await PaymentLink.create(merchantOrderId);
  const paymentUrl = `${PUBLIC_BASE_URL()}/api/payments/pay/${linkToken}`;

  return {
    transactionId,
    merchantOrderId,
    byteTransactionId,
    gatewayOrderId,
    linkToken,
    paymentUrl,
    userId
  };
};

module.exports = {
  createOrder,
  generateByteTransactionId,
  resolveCollectUserId,
  PUBLIC_BASE_URL
};
