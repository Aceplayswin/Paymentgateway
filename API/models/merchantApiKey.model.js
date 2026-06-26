const crypto = require('crypto');
const pool = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

// Public/secret API key pairs for the merchant-facing payment API (/api/v1/*).
// The plaintext secret (sk_…) is returned only once, at generation time; only
// its SHA-256 hash is persisted. HMAC request signing uses the same secret.

const hashSecret = (secret) => crypto.createHash('sha256').update(secret).digest('hex');

const randomToken = (bytes = 24) => crypto.randomBytes(bytes).toString('hex');

// Builds a fresh { keyId, secret } pair for a mode ('test' | 'live').
const generatePair = (mode) => {
  const env = mode === 'live' ? 'live' : 'test';
  return {
    keyId: `pk_${env}_${randomToken(12)}`,
    secret: `sk_${env}_${randomToken(24)}`
  };
};

const mapRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    keyId: row.key_id,
    secretLast4: row.secret_last4,
    mode: row.mode,
    status: row.status,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM merchant_api_keys WHERE id = ? LIMIT 1', [id]);
  return mapRow(rows[0]);
};

// Resolves an active key by its public key_id (used by the API-key middleware).
// Returns { id, userId, keyId, mode, secret } with the recovered plaintext secret
// for HMAC verification, or null if not found.
const findActiveByKeyId = async (keyId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM merchant_api_keys WHERE key_id = ? AND status = 'active' LIMIT 1`,
    [keyId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    keyId: row.key_id,
    mode: row.mode,
    secret: decrypt(row.secret_encrypted)
  };
};

const listByUserId = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM merchant_api_keys
     WHERE user_id = ? AND status = 'active'
     ORDER BY mode ASC, created_at DESC`,
    [userId]
  );
  return rows.map(mapRow);
};

const findActiveByUserAndMode = async (userId, mode) => {
  const [rows] = await pool.execute(
    `SELECT * FROM merchant_api_keys
     WHERE user_id = ? AND mode = ? AND status = 'active' LIMIT 1`,
    [userId, mode]
  );
  return mapRow(rows[0]);
};

const revoke = async (id) => {
  await pool.execute(
    `UPDATE merchant_api_keys SET status = 'revoked', updated_at = NOW() WHERE id = ?`,
    [id]
  );
};

const touchLastUsed = async (id) => {
  await pool.execute('UPDATE merchant_api_keys SET last_used_at = NOW() WHERE id = ?', [id]);
};

// Generates a new key for (userId, mode), revoking any existing active key for
// that mode first (one active key per mode). Returns the public record plus the
// one-time plaintext secret.
const generateForUser = async (userId, mode = 'test') => {
  const safeMode = mode === 'live' ? 'live' : 'test';

  const existing = await findActiveByUserAndMode(userId, safeMode);
  if (existing) {
    await revoke(existing.id);
  }

  const { keyId, secret } = generatePair(safeMode);
  const now = new Date();
  const [result] = await pool.execute(
    `INSERT INTO merchant_api_keys
       (user_id, key_id, secret_hash, secret_encrypted, secret_last4, mode, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    [userId, keyId, hashSecret(secret), encrypt(secret), secret.slice(-4), safeMode, now, now]
  );

  const record = await findById(result.insertId);
  return { record, secret };
};

module.exports = {
  hashSecret,
  generatePair,
  findById,
  findActiveByKeyId,
  listByUserId,
  findActiveByUserAndMode,
  generateForUser,
  revoke,
  touchLastUsed
};
