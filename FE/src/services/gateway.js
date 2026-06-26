import { apiRequest } from "./api";

const PAY = "/api/payments";

// --- Gateway onboarding -----------------------------------------------------

// Razorpay: validate key_id + key_secret from the merchant dashboard.
export function razorpayConnect({ keyId, keySecret, webhookSecret } = {}) {
  return apiRequest(`${PAY}/razorpay/connect`, {
    method: "POST",
    body: { keyId, keySecret, webhookSecret },
  });
}

// --- Payment collection -----------------------------------------------------

// Create a collection order; returns the hosted page URL + Razorpay checkout payload.
export function initiatePayment(provider, payload) {
  return apiRequest(`${PAY}/${provider}/initiate`, {
    method: "POST",
    body: payload,
  });
}

// Poll the order status (auto-confirms once Razorpay reports the payment captured).
export function getOrderStatus(provider, merchantOrderId) {
  return apiRequest(
    `${PAY}/${provider}/status/${encodeURIComponent(merchantOrderId)}`,
  );
}

// --- Gateway config (merchant webhook / display settings) -------------------

// Registers (or updates) the base gateway config row. callbackUrl is the
// merchant webhook fired on a confirmed payment.
export function connectGateway(payload) {
  return apiRequest(`${PAY}/gateway/connect`, {
    method: "POST",
    body: payload,
  });
}

export function updateGatewayConfig(payload) {
  return apiRequest(`${PAY}/gateway/config`, {
    method: "PATCH",
    body: payload,
  });
}

export function listGatewayConfigs() {
  return apiRequest(`${PAY}/gateway/configs`);
}

// --- Public (hosted payment page) -------------------------------------------

// Resolves a payment link token to the order + Razorpay checkout (valid 5 minutes).
export function getHostedPayment(linkToken) {
  return apiRequest(`${PAY}/pay/${encodeURIComponent(linkToken)}`);
}

// Confirms a hosted-page payment with the Razorpay order/payment ids + signature
// from the Checkout handler.
export function verifyHostedPayment(
  provider,
  { byteTransactionId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = {},
) {
  return apiRequest(`${PAY}/${provider}/payment-verify`, {
    method: "POST",
    body: {
      TransactionId: byteTransactionId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    },
  });
}
