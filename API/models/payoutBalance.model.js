const pool = require('../config/db');

const mapRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    availableBalance: Number(row.available_balance),
    pendingAmount: Number(row.pending_amount),
    totalBalance: Number(row.total_balance),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const findByUserId = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM payout_balance WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return mapRow(rows[0]);
};

const upsert = async (userId, data) => {
  const existing = await findByUserId(userId);
  const now = new Date();

  if (!existing) {
    await pool.execute(
      `INSERT INTO payout_balance
         (user_id, available_balance, pending_amount, total_balance, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.availableBalance ?? 0,
        data.pendingAmount ?? 0,
        data.totalBalance ?? 0,
        now,
        now
      ]
    );
    return findByUserId(userId);
  }

  await pool.execute(
    `UPDATE payout_balance
     SET available_balance = ?, pending_amount = ?, total_balance = ?, updated_at = ?
     WHERE user_id = ?`,
    [
      data.availableBalance ?? existing.availableBalance,
      data.pendingAmount ?? existing.pendingAmount,
      data.totalBalance ?? existing.totalBalance,
      now,
      userId
    ]
  );
  return findByUserId(userId);
};

const getPlatformTotals = async () => {
  const [rows] = await pool.execute(
    `SELECT
       COALESCE(SUM(available_balance), 0) AS available_balance,
       COALESCE(SUM(pending_amount), 0) AS pending_amount,
       COALESCE(SUM(total_balance), 0) AS total_balance
     FROM payout_balance`
  );
  return mapRow({ ...rows[0], id: 0, user_id: null, created_at: null, updated_at: null });
};

module.exports = { findByUserId, upsert, getPlatformTotals };
