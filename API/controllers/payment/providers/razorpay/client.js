const crypto = require('crypto');
const Razorpay = require('razorpay');

const getKeyId = (config) => config?.clientId || config?.providerConfig?.keyId || null;
const getKeySecret = (config) => config?.clientSecret || config?.providerConfig?.keySecret || null;
const getWebhookSecret = (config) =>
  config?.providerConfig?.webhookSecret || config?.webhookPassword || null;

const createClient = (config) => {
  const keyId = getKeyId(config);
  const keySecret = getKeySecret(config);
  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys are not configured');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const verifyPaymentSignature = ({ orderId, paymentId, signature }, keySecret) => {
  if (!orderId || !paymentId || !signature || !keySecret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
  return expected === signature;
};

const verifyWebhookSignature = (rawBody, signature, webhookSecret) => {
  if (!rawBody || !signature || !webhookSecret) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return expected === signature;
};

module.exports = {
  getKeyId,
  getKeySecret,
  getWebhookSecret,
  createClient,
  verifyPaymentSignature,
  verifyWebhookSignature
};
