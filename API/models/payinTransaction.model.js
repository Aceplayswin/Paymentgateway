const pool = require('../config/db');

const USER_COLS =
  'u.id AS u_id, u.username AS u_username, u.first_name AS u_first_name, ' +
  'u.last_name AS u_last_name, u.email AS u_email, u.role AS u_role';

const BASE_SELECT =
  `SELECT pt.*, ${USER_COLS} FROM payin_transactions pt ` +
  'LEFT JOIN users u ON pt.user_id = u.id';

const mapPayin = (row) => {
  if (!row) return null;
  return {
    transactionId: row.transaction_id,
    orderId: row.order_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    gatewayProvider: row.gateway_provider,
    gatewayOrderId: row.gateway_order_id,
    byteTransactionId: row.byte_transaction_id,
    utr: row.utr,
    redirectUrl: row.redirect_url,
    remark1: row.remark1,
    remark2: row.remark2,
    gatewayState: row.gateway_state,
    amount: row.amount,
    paymentMethod: row.payment_method,
    status: row.status,
    dateTime: row.date_time,
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

const findById = async (transactionId) => {
  const [rows] = await pool.execute(
    `${BASE_SELECT} WHERE pt.transaction_id = ? LIMIT 1`,
    [transactionId]
  );
  return mapPayin(rows[0]);
};

const findOne = async ({ transactionId, userId }) => {
  let sql = `${BASE_SELECT} WHERE pt.transaction_id = ?`;
  const values = [transactionId];

  if (userId !== undefined) {
    sql += ' AND pt.user_id = ?';
    values.push(userId);
  }

  sql += ' LIMIT 1';
  const [rows] = await pool.query(sql, values);
  return mapPayin(rows[0]);
};

const create = async (data) => {
  const now = new Date();
  await pool.execute(
    `INSERT INTO payin_transactions
       (transaction_id, order_id, customer_name, customer_phone, gateway_provider,
        gateway_order_id, byte_transaction_id, utr, redirect_url, remark1, remark2,
        gateway_state, amount, payment_method, status,
        date_time, user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.transactionId,
      data.orderId,
      data.customerName,
      data.customerPhone || null,
      data.gatewayProvider || null,
      data.gatewayOrderId || null,
      data.byteTransactionId || null,
      data.utr || null,
      data.redirectUrl || null,
      data.remark1 || null,
      data.remark2 || null,
      data.gatewayState || null,
      data.amount,
      data.paymentMethod,
      data.status || 'pending',
      data.dateTime || now,
      data.userId || null,
      now,
      now
    ]
  );
  return findById(data.transactionId);
};

const update = async (transactionId, data) => {
  const fieldMap = {
    orderId: 'order_id',
    customerName: 'customer_name',
    customerPhone: 'customer_phone',
    gatewayProvider: 'gateway_provider',
    gatewayOrderId: 'gateway_order_id',
    byteTransactionId: 'byte_transaction_id',
    utr: 'utr',
    redirectUrl: 'redirect_url',
    remark1: 'remark1',
    remark2: 'remark2',
    gatewayState: 'gateway_state',
    amount: 'amount',
    paymentMethod: 'payment_method',
    status: 'status',
    dateTime: 'date_time',
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

  if (sets.length === 0) return findById(transactionId);

  sets.push('`updated_at` = ?');
  values.push(new Date());
  values.push(transactionId);

  await pool.query(
    `UPDATE payin_transactions SET ${sets.join(', ')} WHERE transaction_id = ?`,
    values
  );
  return findById(transactionId);
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
      '(pt.transaction_id LIKE ? OR pt.order_id LIKE ? OR pt.customer_name LIKE ? OR pt.payment_method LIKE ?)'
    );
    dataValues.push(term, term, term, term);
    countValues.push(term, term, term, term);
  }

  const whereStr =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM payin_transactions pt ${whereStr}`;
  const dataSql = `${BASE_SELECT} ${whereStr} ORDER BY pt.date_time DESC LIMIT ? OFFSET ?`;

  const [[countRows], [rows]] = await Promise.all([
    pool.query(countSql, countValues),
    pool.query(dataSql, [...dataValues, limit, offset])
  ]);

  return { rows: rows.map(mapPayin), count: countRows[0].total };
};

const findByOrderId = async ({ orderId, userId }) => {
  let sql = `${BASE_SELECT} WHERE pt.order_id = ?`;
  const values = [orderId];

  if (userId !== undefined) {
    sql += ' AND pt.user_id = ?';
    values.push(userId);
  }

  sql += ' LIMIT 1';
  const [rows] = await pool.query(sql, values);
  return mapPayin(rows[0]);
};

const findByByteTransactionId = async (byteTransactionId) => {
  const [rows] = await pool.execute(
    `${BASE_SELECT} WHERE pt.byte_transaction_id = ? LIMIT 1`,
    [byteTransactionId]
  );
  return mapPayin(rows[0]);
};

const findByGatewayOrderId = async (gatewayOrderId) => {
  const [rows] = await pool.execute(
    `${BASE_SELECT} WHERE pt.gateway_order_id = ? LIMIT 1`,
    [gatewayOrderId]
  );
  return mapPayin(rows[0]);
};

// Anti-replay guard: has this UTR already been used on a payin transaction?
const utrExists = async (utr) => {
  const [rows] = await pool.execute(
    'SELECT 1 FROM payin_transactions WHERE utr = ? LIMIT 1',
    [utr]
  );
  return rows.length > 0;
};

module.exports = {
  findById,
  findOne,
  findByOrderId,
  findByByteTransactionId,
  findByGatewayOrderId,
  utrExists,
  create,
  update,
  listAndCount
};
