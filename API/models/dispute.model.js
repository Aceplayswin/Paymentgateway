const pool = require('../config/db');

const BASE_SELECT =
  `SELECT d.*, pt.user_id AS txn_user_id,
    u.id AS u_id, u.username AS u_username, u.first_name AS u_first_name,
    u.last_name AS u_last_name, u.email AS u_email
   FROM disputes d
   LEFT JOIN payin_transactions pt ON d.transaction_id = pt.transaction_id
   LEFT JOIN users u ON pt.user_id = u.id`;

const mapDispute = (row) => {
  if (!row) return null;
  return {
    disputeId: row.dispute_id,
    transactionId: row.transaction_id,
    type: row.type,
    reason: row.reason,
    status: row.status,
    resolutionNotes: row.resolution_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.txn_user_id,
    user: row.u_id
      ? {
          id: row.u_id,
          username: row.u_username,
          firstName: row.u_first_name,
          lastName: row.u_last_name,
          email: row.u_email
        }
      : null
  };
};

const findById = async (disputeId) => {
  const [rows] = await pool.execute(`${BASE_SELECT} WHERE d.dispute_id = ? LIMIT 1`, [disputeId]);
  return mapDispute(rows[0]);
};

const create = async (data) => {
  const now = new Date();
  await pool.execute(
    `INSERT INTO disputes
       (dispute_id, transaction_id, type, reason, status, resolution_notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.disputeId,
      data.transactionId,
      data.type || 'complaint',
      data.reason,
      data.status || 'open',
      data.resolutionNotes || null,
      now,
      now
    ]
  );
  return findById(data.disputeId);
};

const listAndCount = async ({ userId, type, status, search, limit, offset }) => {
  const whereClauses = [];
  const dataValues = [];
  const countValues = [];

  if (userId !== undefined) {
    whereClauses.push('pt.user_id = ?');
    dataValues.push(userId);
    countValues.push(userId);
  }

  if (type) {
    whereClauses.push('d.type = ?');
    dataValues.push(String(type).toLowerCase());
    countValues.push(String(type).toLowerCase());
  }

  if (status) {
    whereClauses.push('d.status = ?');
    dataValues.push(String(status).toLowerCase());
    countValues.push(String(status).toLowerCase());
  }

  if (search) {
    const term = `%${search}%`;
    whereClauses.push('(d.dispute_id LIKE ? OR d.reason LIKE ? OR d.transaction_id LIKE ?)');
    dataValues.push(term, term, term);
    countValues.push(term, term, term);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql =
    `SELECT COUNT(*) AS total FROM disputes d
     LEFT JOIN payin_transactions pt ON d.transaction_id = pt.transaction_id ${whereStr}`;
  const dataSql = `${BASE_SELECT} ${whereStr} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`;

  const [[countRows], [rows]] = await Promise.all([
    pool.query(countSql, countValues),
    pool.query(dataSql, [...dataValues, limit, offset])
  ]);

  return { rows: rows.map(mapDispute), count: countRows[0].total };
};

const generateDisputeId = (prefix = 'CMP') =>
  `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

module.exports = { findById, create, listAndCount, generateDisputeId };
