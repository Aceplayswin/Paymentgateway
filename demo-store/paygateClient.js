// Thin client for the Paygate (Ultraconic PG) PUBLIC payment API (/api/v1/*).
//
// Authentication is by MERCHANT API KEY, not email/password. The key pair
// identifies the merchant: the platform resolves PAYGATE_KEY_ID to the owning
// merchant and routes the payment to THAT merchant's Razorpay account. Every
// request is signed with the secret so only the key holder can transact.
//
// Mirrors the contract in:
//   API/routes/v1.routes.js
//   API/middleware/apiKey.middleware.js
//   API/controllers/v1/publicPayment.controller.js
const crypto = require('crypto');
const axios = require('axios');

const API_URL = (process.env.PAYGATE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const PROVIDER = process.env.PAYGATE_PROVIDER || 'razorpay';
const KEY_ID = process.env.PAYGATE_KEY_ID;
const KEY_SECRET = process.env.PAYGATE_KEY_SECRET;

const api = axios.create({ baseURL: API_URL, timeout: 30000 });

const assertKeys = () => {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error(
      'PAYGATE_KEY_ID / PAYGATE_KEY_SECRET are not set. Generate merchant API ' +
        'keys from the Paygate dashboard and copy .env.example to .env.'
    );
  }
};

// Builds the signed headers the API-key middleware expects:
//   X-Api-Key   : public key id
//   X-Timestamp : unix seconds (replay window is ±5 min on the server)
//   X-Signature : hex HMAC-SHA256( `${timestamp}.${rawBody}` , secret )
// rawBody MUST be the exact JSON string sent on the wire, so callers pass the
// already-serialized body and send that same string as the request payload.
const signedHeaders = (rawBody = '') => {
  assertKeys();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': KEY_ID,
    'X-Timestamp': timestamp,
    'X-Signature': signature
  };
};

// --- payment flow -----------------------------------------------------------

// Create a payment order on the platform. The merchant is inferred from the API
// key, so no merchant id is sent — the platform resolves the key to the owning
// merchant and routes the order to THAT merchant's Razorpay account. The public
// API returns our own ids plus a per-order hosted link (paymentUrl).
// Returns { orderId, referenceId, amount, currency, status, paymentUrl, ... }.
const initiatePayment = async ({ customerName, customerPhone, amount, orderId, redirectUrl, remark1 }) => {
  const rawBody = JSON.stringify({
    amount,
    currency: 'INR',
    customerName,
    customerPhone,
    orderId,
    redirectUrl,
    remark1
  });
  const { data } = await api.post('/api/v1/payment/orders', rawBody, {
    headers: signedHeaders(rawBody)
  });
  return data.data;
};

// Fetch the Razorpay checkout payload for an order from its hosted link. The
// paymentUrl carries a short-lived per-order link token, so this endpoint is
// public (no API key / signature) — it exposes only that one order's checkout
// data, never the merchant keys. Returns { checkout, byteTransactionId, ... }.
const fetchCheckout = async (paymentUrl) => {
  const { data } = await api.get(paymentUrl);
  return data.data;
};

// Confirm a Razorpay checkout result via the public payment-verify endpoint
// (also public — keyed by byteTransactionId + the Razorpay signature).
// Returns { status: 'success'|'pending', redirectUrl }.
const verifyPayment = async ({ byteTransactionId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const { data } = await api.post(`/api/payments/${PROVIDER}/payment-verify`, {
    byteTransactionId,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature
  });
  return data.data;
};

// Server-to-server status lookup for one of our orders. GET has no body, so the
// signature is computed over an empty rawBody.
// Returns { orderId, referenceId, status: 'created'|'paid'|'failed'|'refunded', utr }.
const getOrderStatus = async (merchantOrderId) => {
  const { data } = await api.get(
    `/api/v1/payment/orders/${encodeURIComponent(merchantOrderId)}`,
    { headers: signedHeaders('') }
  );
  return data.data;
};

module.exports = {
  API_URL,
  PROVIDER,
  KEY_ID,
  initiatePayment,
  fetchCheckout,
  verifyPayment,
  getOrderStatus
};
