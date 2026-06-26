// DummyMart — a standalone dummy merchant store used to test the Paygate
// (Razorpay-backed white-label) gateway end-to-end, exactly as a normal user
// would: browse products, check out, pay, and land on a result page. It talks
// to the Paygate API only over HTTP, so it is fully decoupled from FE/ and API/.
//
// Auth is by MERCHANT API KEY (see paygateClient.js): the key identifies the
// merchant on the platform and routes the payment to that merchant's Razorpay
// account. There is no email/password login here.
require('dotenv').config();

const path = require('path');
const express = require('express');
const paygate = require('./paygateClient');

const PORT = Number(process.env.PORT || 4500);
const STORE_BASE_URL = (process.env.STORE_BASE_URL || `http://localhost:${PORT}`).replace(
  /\/+$/,
  ''
);

const app = express();
app.use(express.json());
// The gateway fires the merchant callback as x-www-form-urlencoded (see
// API/controllers/payment/providers/merchantWebhook.js).
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- in-memory order book (demo only) ---------------------------------------
// orderId -> { orderId, amount, customer, status, byteTransactionId, ... }
const orders = new Map();

const newOrderId = () => `DM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

// Maps the public API status vocabulary (created/paid/failed/refunded) onto the
// storefront's (pending/success/failed) used by the result page.
const toStoreStatus = (apiStatus) => {
  switch (String(apiStatus || '').toLowerCase()) {
    case 'paid':
      return 'success';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
};

// 1) Checkout: the storefront posts the cart + customer details here. We create
//    an order with the Paygate gateway (signed with our merchant API key) and
//    hand the browser the hosted paymentUrl to pay on.
app.post('/api/checkout', async (req, res) => {
  try {
    const { customerName, customerPhone, amount, items } = req.body || {};
    if (!customerName || !customerPhone || !(Number(amount) > 0)) {
      return res
        .status(400)
        .json({ success: false, message: 'customerName, customerPhone and amount are required.' });
    }

    const orderId = newOrderId();
    const redirectUrl = `${STORE_BASE_URL}/result?orderId=${encodeURIComponent(orderId)}`;

    const result = await paygate.initiatePayment({
      customerName,
      customerPhone,
      amount: Number(amount),
      orderId,
      redirectUrl,
      remark1: 'DummyMart order'
    });

    // The key-authed create response withholds the Razorpay payload; fetch it
    // from the per-order hosted link so the browser can open the widget inline.
    const hosted = await paygate.fetchCheckout(result.paymentUrl);

    orders.set(orderId, {
      orderId,
      // The platform echoes our orderId back as the canonical merchant order id.
      merchantOrderId: result.orderId || hosted.merchantOrderId || orderId,
      byteTransactionId: result.referenceId || hosted.byteTransactionId,
      razorpayOrderId: hosted.checkout?.order_id,
      amount: Number(amount),
      items: items || [],
      customer: { name: customerName, phone: customerPhone },
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      orderId,
      checkout: hosted.checkout, // { key, order_id, amount, currency, name, prefill, ... }
      byteTransactionId: result.referenceId || hosted.byteTransactionId,
      paymentUrl: result.paymentUrl // hosted JSON link (fallback reference)
    });
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || 'Failed to initiate payment.';
    return res.status(error.response?.status || 500).json({ success: false, message });
  }
});

// 2) Verify: the browser hands back the Razorpay checkout result. We forward it
//    to the gateway's public payment-verify endpoint and record the outcome.
app.post('/api/verify', async (req, res) => {
  try {
    const {
      orderId,
      byteTransactionId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    } = req.body || {};

    const verification = await paygate.verifyPayment({
      byteTransactionId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    const order = orders.get(orderId);
    if (order && verification?.status) {
      order.status = verification.status === 'success' ? 'success' : 'pending';
      order.verifiedAt = new Date().toISOString();
    }

    return res.json({ success: true, status: verification?.status || 'pending' });
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Verification failed.';
    return res.status(error.response?.status || 500).json({ success: false, message });
  }
});

// 3) Server-to-server callback fired by the gateway on a confirmed payment.
//    Body: order_id, status, remark1 (urlencoded). Best-effort: ack with 200.
app.all('/api/paygate-callback', (req, res) => {
  const orderId = req.body.order_id || req.query.order_id;
  const status = req.body.status || req.query.status;
  const utr = req.body.utr || req.query.utr;

  const order = orders.get(orderId);
  if (order && String(status).toUpperCase() === 'SUCCESS') {
    order.status = 'success';
    order.utr = utr || order.utr || null;
    order.callbackAt = new Date().toISOString();
  }
  console.log(`[paygate-callback] order=${orderId} status=${status} utr=${utr || '-'}`);
  return res.json({ received: true });
});

// 4) Status lookup for the result page. Falls back to a live gateway poll (signed
//    with our merchant API key) if our local record is still pending — covers
//    both hosted-page confirmation and webhook-driven confirmations.
app.get('/api/order/:orderId', async (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  if (order.status === 'pending') {
    try {
      const live = await paygate.getOrderStatus(order.merchantOrderId || order.orderId);
      const mapped = toStoreStatus(live?.status);
      if (mapped !== 'pending') {
        order.status = mapped;
        order.utr = live.utr || order.utr || null;
      }
    } catch {
      // keep local status; gateway may be unreachable for the poll
    }
  }
  return res.json({ success: true, order });
});

// Result landing page (redirect target after checkout).
app.get('/result', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'result.html'));
});

app.listen(PORT, () => {
  console.log(`\n  DummyMart demo store running:  ${STORE_BASE_URL}`);
  console.log(`  Talking to Paygate API at:     ${paygate.API_URL}`);
  console.log(`  Gateway provider:              ${paygate.PROVIDER}`);
  console.log(`  Merchant API key:              ${paygate.KEY_ID || '(not set — see .env)'}\n`);
});
