const MerchantApiKey = require('../../models/merchantApiKey.model');

// Dashboard (JWT) endpoints for merchants to view and manage their API keys.
// The plaintext secret is returned ONLY in the response to a generate/regenerate
// call — it is never retrievable again afterwards.

const resolveUserId = (req) =>
  req.user.role === 'merchant' ? req.user.id : req.body.merchantId || req.user.id;

// GET /api/developer/api-keys
exports.listKeys = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const keys = await MerchantApiKey.listByUserId(userId);
    return res.status(200).json({
      success: true,
      data: {
        keys: keys.map((k) => ({
          id: k.id,
          keyId: k.keyId,
          mode: k.mode,
          secretLast4: k.secretLast4,
          status: k.status,
          lastUsedAt: k.lastUsedAt,
          createdAt: k.createdAt
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/developer/api-keys/generate   Body: { mode: 'test' | 'live' }
// Generates (or regenerates) the key for a mode. Any existing active key for that
// mode is revoked. Returns the one-time plaintext secret.
exports.generateKey = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const mode = req.body.mode === 'live' ? 'live' : 'test';

    const { record, secret } = await MerchantApiKey.generateForUser(userId, mode);

    return res.status(201).json({
      success: true,
      message: 'API key generated. Copy the secret now — it will not be shown again.',
      data: {
        keyId: record.keyId,
        secret, // shown once
        mode: record.mode,
        createdAt: record.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/developer/api-keys/revoke   Body: { mode: 'test' | 'live' }
exports.revokeKey = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const mode = req.body.mode === 'live' ? 'live' : 'test';
    const existing = await MerchantApiKey.findActiveByUserAndMode(userId, mode);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'No active key for this mode' });
    }
    await MerchantApiKey.revoke(existing.id);
    return res.status(200).json({ success: true, message: 'API key revoked' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
