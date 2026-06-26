const pool = require('../config/db');

const mapSession = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    isRevoked: Boolean(row.is_revoked),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const create = async (data) => {
  const now = new Date();
  const [result] = await pool.execute(
    `INSERT INTO user_sessions
       (user_id, refresh_token, expires_at, is_revoked, ip_address, user_agent,
        last_used_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.userId,
      data.refreshToken,
      data.expiresAt,
      false,
      data.ipAddress || null,
      data.userAgent || null,
      now,
      now,
      now
    ]
  );
  const [rows] = await pool.execute(
    'SELECT * FROM user_sessions WHERE id = ? LIMIT 1',
    [result.insertId]
  );
  return mapSession(rows[0]);
};

const findActiveSession = async ({ refreshToken, userId }) => {
  const [rows] = await pool.execute(
    'SELECT * FROM user_sessions WHERE refresh_token = ? AND user_id = ? AND is_revoked = ? LIMIT 1',
    [refreshToken, userId, false]
  );
  return mapSession(rows[0]);
};

const updateLastUsed = async (id) => {
  const now = new Date();
  await pool.execute(
    'UPDATE user_sessions SET last_used_at = ?, updated_at = ? WHERE id = ?',
    [now, now, id]
  );
};

const revokeAllForUser = async (userId) => {
  const now = new Date();
  await pool.execute(
    'UPDATE user_sessions SET is_revoked = ?, updated_at = ? WHERE user_id = ? AND is_revoked = ?',
    [true, now, userId, false]
  );
};

module.exports = { create, findActiveSession, updateLastUsed, revokeAllForUser };
