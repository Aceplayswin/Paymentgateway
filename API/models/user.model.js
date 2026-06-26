const pool = require('../config/db');

const mapUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phoneNumber: row.phone_number,
    password: row.password,
    role: row.role,
    approvalStatus: row.approval_status,
    kycStatus: row.kyc_status || 'unverified',
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    approvalRequestedAt: row.approval_requested_at,
    rejectedAt: row.rejected_at,
    rejectedBy: row.rejected_by,
    rejectionReason: row.rejection_reason,
    otpCode: row.otp_code,
    otpExpiresAt: row.otp_expires_at,
    otpVerifiedAt: row.otp_verified_at,
    lastLogin: row.last_login,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const FIELD_MAP = {
  username: 'username',
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  phoneNumber: 'phone_number',
  password: 'password',
  role: 'role',
  approvalStatus: 'approval_status',
  kycStatus: 'kyc_status',
  approvedAt: 'approved_at',
  approvedBy: 'approved_by',
  approvalRequestedAt: 'approval_requested_at',
  rejectedAt: 'rejected_at',
  rejectedBy: 'rejected_by',
  rejectionReason: 'rejection_reason',
  otpCode: 'otp_code',
  otpExpiresAt: 'otp_expires_at',
  otpVerifiedAt: 'otp_verified_at',
  lastLogin: 'last_login'
};

const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return mapUser(rows[0]);
};

const findByEmail = async (email) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return mapUser(rows[0]);
};

const findByEmailAndRole = async (email, role) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? AND role = ? LIMIT 1',
    [email, role]
  );
  return mapUser(rows[0]);
};

const findByUsername = async (username) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  return mapUser(rows[0]);
};

const findMerchantById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE id = ? AND role = ? LIMIT 1',
    [id, 'merchant']
  );
  return mapUser(rows[0]);
};

const findMerchants = async (status) => {
  let sql = 'SELECT * FROM users WHERE role = ? AND otp_verified_at IS NOT NULL';
  const values = ['merchant'];

  if (status && status !== 'all') {
    sql += ' AND approval_status = ?';
    values.push(status);
  }

  const orderCol =
    status === 'approved' ? 'approved_at' :
    status === 'rejected' ? 'rejected_at' :
    'approval_requested_at';

  sql += ` ORDER BY ${orderCol} DESC, created_at DESC`;
  const [rows] = await pool.query(sql, values);
  return rows.map(mapUser);
};

const create = async (data) => {
  const now = new Date();
  const [result] = await pool.execute(
    `INSERT INTO users
       (username, first_name, last_name, email, phone_number, password, role,
        approval_status, kyc_status, approval_requested_at, otp_verified_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.username,
      data.firstName,
      data.lastName,
      data.email,
      data.phoneNumber || null,
      data.password,
      data.role || 'merchant',
      data.approvalStatus || 'pending',
      data.kycStatus || 'unverified',
      data.approvalRequestedAt || null,
      data.otpVerifiedAt || null,
      now,
      now
    ]
  );
  return findById(result.insertId);
};

const update = async (id, data) => {
  const sets = [];
  const values = [];

  for (const [key, col] of Object.entries(FIELD_MAP)) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      sets.push(`\`${col}\` = ?`);
      values.push(data[key] !== undefined ? data[key] : null);
    }
  }

  if (sets.length === 0) return findById(id);

  sets.push('`updated_at` = ?');
  values.push(new Date());
  values.push(id);

  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
  return findById(id);
};

module.exports = {
  findById,
  findByEmail,
  findByEmailAndRole,
  findByUsername,
  findMerchantById,
  findMerchants,
  create,
  update
};
