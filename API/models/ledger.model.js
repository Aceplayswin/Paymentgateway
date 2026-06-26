const pool = require('../config/db');

const USER_COLS =
  'u.id AS u_id, u.username AS u_username, u.first_name AS u_first_name, ' +
  'u.last_name AS u_last_name, u.email AS u_email, u.role AS u_role';

const BASE_SELECT =
  `SELECT l.*, ${USER_COLS} FROM ledger l ` +
  'LEFT JOIN users u ON l.user_id = u.id';

const mapLedger = (row) => {
  if (!row) return null;
  return {
    entryId: row.entry_id,
    debitCredit: row.debit_credit,
    amount: row.amount,
    balance: row.balance,
    referenceId: row.reference_id,
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

const findById = async (entryId) => {
  const [rows] = await pool.execute(`${BASE_SELECT} WHERE l.entry_id = ? LIMIT 1`, [entryId]);
  return mapLedger(rows[0]);
};

const create = async (data) => {
  const now = new Date();
  await pool.execute(
    `INSERT INTO ledger
       (entry_id, debit_credit, amount, balance, reference_id, \`timestamp\`, user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.entryId,
      data.debitCredit,
      data.amount,
      data.balance,
      data.referenceId || null,
      data.timestamp || now,
      data.userId || null,
      now,
      now
    ]
  );
  return findById(data.entryId);
};

const listAndCount = async ({ userId, debitCredit, search, limit, offset }) => {
  const whereClauses = [];
  const dataValues = [];
  const countValues = [];

  if (userId !== undefined) {
    whereClauses.push('l.user_id = ?');
    dataValues.push(userId);
    countValues.push(userId);
  }

  if (debitCredit) {
    whereClauses.push('l.debit_credit = ?');
    dataValues.push(String(debitCredit).toLowerCase());
    countValues.push(String(debitCredit).toLowerCase());
  }

  if (search) {
    const term = `%${search}%`;
    whereClauses.push('(l.entry_id LIKE ? OR l.reference_id LIKE ?)');
    dataValues.push(term, term);
    countValues.push(term, term);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) AS total FROM ledger l ${whereStr}`;
  const dataSql = `${BASE_SELECT} ${whereStr} ORDER BY l.\`timestamp\` DESC LIMIT ? OFFSET ?`;

  const [[countRows], [rows]] = await Promise.all([
    pool.query(countSql, countValues),
    pool.query(dataSql, [...dataValues, limit, offset])
  ]);

  return { rows: rows.map(mapLedger), count: countRows[0].total };
};

const generateEntryId = () => `LDG${Date.now()}${Math.floor(Math.random() * 1000)}`;

module.exports = { findById, create, listAndCount, generateEntryId };
