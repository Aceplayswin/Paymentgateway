const axios = require('axios');

// Fires the merchant's configured callback/webhook on a confirmed payment,
// mirroring the PHP status pages which POST {order_id, status, remark1} to
// users.callback_url and then GET it again with query params.
//
// The merchant webhook URL lives in the gateway config's
// provider_config.callbackUrl (set when the merchant connects / via gateway
// update). Best-effort: failures are swallowed so settlement still completes.
const fireMerchantWebhook = async (callbackUrl, { orderId, status = 'SUCCESS', remark1, utr }) => {
  if (!callbackUrl) return;

  const postData = new URLSearchParams({
    order_id: orderId,
    status,
    remark1: remark1 || ''
  });

  try {
    await axios.post(callbackUrl, postData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
      validateStatus: () => true
    });
  } catch {
    // ignore — merchant endpoint may be down
  }

  // Second GET notification with query params (PHP fires this for BharatPe/GPay).
  if (utr) {
    try {
      const url = new URL(callbackUrl);
      url.searchParams.set('status', status);
      url.searchParams.set('utr', utr);
      url.searchParams.set('order_id', orderId);
      await axios.get(url.toString(), { timeout: 15000, validateStatus: () => true });
    } catch {
      // ignore
    }
  }
};

module.exports = { fireMerchantWebhook };
