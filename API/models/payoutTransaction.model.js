const pool = require('../config/db');

const USER_COLS =
  'u.id AS u_id, u.username AS u_username, u.first_name AS u_first_name, ' +
  'u.last_name AS u_last_name, u.email AS u_email, u.role AS u_role';

const BASE_SELECT =
  `SELECT pt.*, ${USER_COLS} FROM payout_transactions pt ` +
  'LEFT JOIN users u ON pt.user_id = u.id';

const mapPayout = (row) => {
  if (!row) return null;
  return {
    payoutId: row.payout_id,
    beneficiaryName: row.beneficiary_name,
    bankDetails: row.bank_details,
    amount: row.amount,
    status: row.status,
    timestamp: row.timestamp,
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

const findById = async (payoutId) => {
  const [rows] = await pool.execute(
    `${BASE_SELECT} WHERE pt.payout_id = ? LIMIT 1`,
    [payoutId]
  );
  return mapPayout(rows[0]);
};

const findOne = async ({ payoutId, userId }) => {
  let sql = `${BASE_SELECT} WHERE pt.payout_id = ?`;
  const values = [payoutId];

  if (userId !== undefined) {
    sql += ' AND pt.user_id = ?';
    values.push(userId);
  }

  sql += ' LIMIT 1';
  const [rows] = await pool.query(sql, values);
  return mapPayout(rows[0]);
};

const create = async (data) => {
  const now = new Date();
  await pool.execute(
    `INSERT INTO payout_transactions
       (payout_id, beneficiary_name, bank_details, amount, status,
        \`timestamp\`, user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.payoutId,
      data.beneficiaryName,
      data.bankDetails,
      data.amount,
      data.status || 'pending',
      data.timestamp || now,
      data.userId || null,
      now,
      now
    ]
  );
  return findById(data.payoutId);
};

const update = async (payoutId, data) => {
  const fieldMap = {
    beneficiaryName: 'beneficiary_name',
    bankDetails: 'bank_details',
    amount: 'amount',
    status: 'status',
    timestamp: 'timestamp',
    userId: 'user_id'
  };

  const sets = [];
  const values = [];

  for (const [key, col] of Object.entries(fieldMap)) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      sets.push(`\`${col}\` = ?`);
      values.push(data[key]);
    }
  }

  if (sets.length === 0) return findById(payoutId);

  sets.push('`updated_at` = ?');
  values.push(new Date());
  values.push(payoutId);

  await pool.query(
    `UPDATE payout_transactions SET ${sets.join(', ')} WHERE payout_id = ?`,
    values
  );
  return findById(payoutId);
};

const listAndCount = async ({ userId, status, search, limit, offset }) => {
  const whereClauses = [];
  const dataValues = [];
  const countValues = [];

  if (userId !== undefined) {
    whereClauses.push('pt.user_id = ?');
    dataValues.push(userId);
    countValues.push(userId);
  }

  if (status) {
    whereClauses.push('pt.status = ?');
    dataValues.push(status);
    countValues.push(status);
  }

  if (search) {
    const term = `%${search}%`;
    whereClauses.push(
      '(pt.payout_id LIKE ? OR pt.beneficiary_name LIKE ? OR pt.bank_details LIKE ?)'
    );
    dataValues.push(term, term, term);
    countValues.push(term, term, term);
  }

  const whereStr =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM payout_transactions pt ${whereStr}`;
  const dataSql = `${BASE_SELECT} ${whereStr} ORDER BY pt.\`timestamp\` DESC LIMIT ? OFFSET ?`;

  const [[countRows], [rows]] = await Promise.all([
    pool.query(countSql, countValues),
    pool.query(dataSql, [...dataValues, limit, offset])
  ]);

  return { rows: rows.map(mapPayout), count: countRows[0].total };
};

module.exports = { findById, findOne, create, update, listAndCount };
