const pool = require('../config/db');

const mapRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    allowedIpAddress: row.allowed_ip_address,
    status: row.status,
    addedDate: row.added_date,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM ip_whitelist WHERE id = ? LIMIT 1', [id]);
  return mapRow(rows[0]);
};

const create = async (data) => {
  const now = new Date();
  const [result] = await pool.execute(
    `INSERT INTO ip_whitelist
       (allowed_ip_address, status, added_date, user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.allowedIpAddress,
      data.status || 'active',
      data.addedDate || new Date().toISOString().slice(0, 10),
      data.userId || null,
      now,
      now
    ]
  );
  return findById(result.insertId);
};

const update = async (id, data) => {
  const fieldMap = {
    allowedIpAddress: 'allowed_ip_address',
    status: 'status',
    addedDate: 'added_date'
  };

  const sets = [];
  const values = [];

  for (const [key, col] of Object.entries(fieldMap)) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      sets.push(`\`${col}\` = ?`);
      values.push(data[key]);
    }
  }

  if (sets.length === 0) return findById(id);

  sets.push('`updated_at` = ?');
  values.push(new Date(), id);

  await pool.query(`UPDATE ip_whitelist SET ${sets.join(', ')} WHERE id = ?`, values);
  return findById(id);
};

const listAndCount = async ({ userId, status, limit, offset }) => {
  const whereClauses = [];
  const dataValues = [];
  const countValues = [];

  if (userId !== undefined) {
    whereClauses.push('user_id = ?');
    dataValues.push(userId);
    countValues.push(userId);
  }

  if (status) {
    whereClauses.push('status = ?');
    dataValues.push(String(status).toLowerCase());
    countValues.push(String(status).toLowerCase());
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) AS total FROM ip_whitelist ${whereStr}`;
  const dataSql = `SELECT * FROM ip_whitelist ${whereStr} ORDER BY added_date DESC LIMIT ? OFFSET ?`;

  const [[countRows], [rows]] = await Promise.all([
    pool.query(countSql, countValues),
    pool.query(dataSql, [...dataValues, limit, offset])
  ]);

  return { rows: rows.map(mapRow), count: countRows[0].total };
};

module.exports = { findById, create, update, listAndCount };
