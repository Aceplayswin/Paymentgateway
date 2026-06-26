const pool = require('../config/db');

const USER_COLS =
  'u.id AS u_id, u.username AS u_username, u.first_name AS u_first_name, ' +
  'u.last_name AS u_last_name, u.email AS u_email, u.role AS u_role';

const BASE_SELECT =
  `SELECT s.*, ${USER_COLS} FROM settlements s ` +
  'LEFT JOIN users u ON s.user_id = u.id';

const mapSettlement = (row) => {
  if (!row) return null;
  return {
    settlementId: row.settlement_id,
    totalAmount: row.total_amount,
    fees: row.fees,
    netAmount: row.net_amount,
    settlementStatus: row.settlement_status,
    settlementDate: row.settlement_date,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: row.u_id
      ? {
          id: row.u_id,
          username: row.u_username,
          firstName: row.u_first_name,
          lastName: row.u_last_name,
          email: row.u_email,
          role: row.u_role
        }
      : null
  };
};

const findById = async (settlementId) => {
  const [rows] = await pool.execute(
    `${BASE_SELECT} WHERE s.settlement_id = ? LIMIT 1`,
    [settlementId]
  );
  return mapSettlement(rows[0]);
};

const findOne = async ({ settlementId, userId }) => {
  let sql = `${BASE_SELECT} WHERE s.settlement_id = ?`;
  const values = [settlementId];

  if (userId !== undefined) {
    sql += ' AND s.user_id = ?';
    values.push(userId);
  }

  sql += ' LIMIT 1';
  const [rows] = await pool.query(sql, values);
  return mapSettlement(rows[0]);
};

const create = async (data) => {
  const now = new Date();
  await pool.execute(
    `INSERT INTO settlements
       (settlement_id, total_amount, fees, net_amount, settlement_status,
        settlement_date, user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.settlementId,
      data.totalAmount,
      data.fees ?? 0,
      data.netAmount,
      data.settlementStatus || 'pending',
      data.settlementDate || null,
      data.userId || null,
      now,
      now
    ]
  );
  return findById(data.settlementId);
};

const listAndCount = async ({ userId, status, search, limit, offset }) => {
  const whereClauses = [];
  const dataValues = [];
  const countValues = [];

  if (userId !== undefined) {
    whereClauses.push('s.user_id = ?');
    dataValues.push(userId);
    countValues.push(userId);
  }

  if (status) {
    whereClauses.push('s.settlement_status = ?');
    dataValues.push(String(status).toLowerCase());
    countValues.push(String(status).toLowerCase());
  }

  if (search) {
    const term = `%${search}%`;
    whereClauses.push('(s.settlement_id LIKE ? OR s.settlement_status LIKE ?)');
    dataValues.push(term, term);
    countValues.push(term, term);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) AS total FROM settlements s ${whereStr}`;
  const dataSql = `${BASE_SELECT} ${whereStr} ORDER BY s.settlement_date DESC, s.created_at DESC LIMIT ? OFFSET ?`;

  const [[countRows], [rows]] = await Promise.all([
    pool.query(countSql, countValues),
    pool.query(dataSql, [...dataValues, limit, offset])
  ]);

  return { rows: rows.map(mapSettlement), count: countRows[0].total };
};

const generateSettlementId = () => `STL${Date.now()}${Math.floor(Math.random() * 1000)}`;

module.exports = { findById, findOne, create, listAndCount, generateSettlementId };
