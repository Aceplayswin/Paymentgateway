const crypto = require('crypto');

// AES-256-GCM encryption for secrets that must be recoverable at rest (e.g. API
// key secrets needed to verify merchant HMAC signatures). The key comes from
// SECRETS_ENCRYPTION_KEY (64 hex chars = 32 bytes). In development a deterministic
// fallback derived from JWT_SECRET is used so the app still boots, but production
// MUST set SECRETS_ENCRYPTION_KEY.

const ALGO = 'aes-256-gcm';

const getKey = () => {
  const raw = process.env.SECRETS_ENCRYPTION_KEY;
  if (raw && /^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  // Development fallback: derive a stable 32-byte key from JWT_SECRET.
  const seed = process.env.JWT_SECRET || 'insecure-dev-secret';
  return crypto.createHash('sha256').update(`secrets:${seed}`).digest();
};

// Returns "iv:authTag:ciphertext" (all hex).
const encrypt = (plaintext) => {
  if (plaintext == null) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (payload) => {
  if (!payload) return null;
  const [ivHex, tagHex, dataHex] = String(payload).split(':');
  if (!ivHex || !tagHex || !dataHex) return null;
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
};

// Constant-time HMAC-SHA256 comparison helper.
const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a || ''), 'utf8');
  const bufB = Buffer.from(String(b || ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const hmacSha256 = (message, secret) =>
  crypto.createHmac('sha256', secret).update(message).digest('hex');

module.exports = { encrypt, decrypt, safeEqual, hmacSha256 };
