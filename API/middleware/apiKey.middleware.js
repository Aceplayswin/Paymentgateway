const MerchantApiKey = require('../models/merchantApiKey.model');
const User = require('../models/user.model');
const { hmacSha256, safeEqual } = require('../utils/crypto');

// Authenticates public payment API (/api/v1/*) requests with API key + HMAC.
//
//   X-Api-Key    : the public key_id (pk_test_… / pk_live_…)
//   X-Timestamp  : unix seconds; must be within ±REPLAY_WINDOW_SECONDS of now
//   X-Signature  : hex HMAC-SHA256( `${X-Timestamp}.${rawBody}` , secret )
//
// On success attaches req.merchant = { id, ... } and req.apiKey = { id, mode }.

const REPLAY_WINDOW_SECONDS = 300; // 5 minutes

const unauthorized = (res, message) =>
  res.status(401).json({ success: false, message });

const requireApiKey = async (req, res, next) => {
  try {
    const apiKeyId = req.header('X-Api-Key');
    const timestamp = req.header('X-Timestamp');
    const signature = req.header('X-Signature');

    if (!apiKeyId || !timestamp || !signature) {
      return unauthorized(
        res,
        'Missing X-Api-Key, X-Timestamp or X-Signature header'
      );
    }

    // Replay protection: reject stale or future-dated requests.
    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) {
      return unauthorized(res, 'Invalid X-Timestamp');
    }
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - ts) > REPLAY_WINDOW_SECONDS) {
      return unauthorized(res, 'Request timestamp outside the allowed window');
    }

    const apiKey = await MerchantApiKey.findActiveByKeyId(apiKeyId);
    if (!apiKey || !apiKey.secret) {
      return unauthorized(res, 'Invalid or revoked API key');
    }

    // The merchant signs `${timestamp}.${rawBody}`; rawBody is captured by the
    // express.json verify hook on the v1 router.
    const rawBody = req.rawBody || '';
    const expected = hmacSha256(`${timestamp}.${rawBody}`, apiKey.secret);

    if (!safeEqual(expected, signature)) {
      return unauthorized(res, 'Invalid request signature');
    }

    const merchant = await User.findMerchantById(apiKey.userId);
    if (!merchant) {
      return unauthorized(res, 'Merchant account not found');
    }
    if (merchant.approvalStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Merchant account is not approved for API access'
      });
    }

    // Best-effort usage tracking; never blocks the request.
    MerchantApiKey.touchLastUsed(apiKey.id).catch(() => {});

    req.merchant = merchant;
    req.user = { id: merchant.id, role: 'merchant' };
    req.apiKey = { id: apiKey.id, mode: apiKey.mode, keyId: apiKey.keyId };
    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { requireApiKey, REPLAY_WINDOW_SECONDS };
