const pool = require('../config/db');

const parseJson = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const mapKyc = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    formData: parseJson(row.form_data),
    draftData: parseJson(row.draft_data),
    draftCurrentStep: row.draft_current_step,
    draftSavedAt: row.draft_saved_at,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    rejectedAt: row.rejected_at,
    rejectedBy: row.rejected_by,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const FIELD_MAP = {
  status: 'status',
  formData: 'form_data',
  draftData: 'draft_data',
  draftCurrentStep: 'draft_current_step',
  draftSavedAt: 'draft_saved_at',
  submittedAt: 'submitted_at',
  approvedAt: 'approved_at',
  approvedBy: 'approved_by',
  rejectedAt: 'rejected_at',
  rejectedBy: 'rejected_by',
  rejectionReason: 'rejection_reason'
};

const serializeFieldValue = (key, value) => {
  if (key === 'formData' || key === 'draftData') {
    return value === null || value === undefined ? null : JSON.stringify(value);
  }

  return value !== undefined ? value : null;
};

const findByUserId = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM merchant_kyc WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return mapKyc(rows[0]);
};

const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM merchant_kyc WHERE id = ? LIMIT 1', [id]);
  return mapKyc(rows[0]);
};

const findSubmitted = async () => {
  const [rows] = await pool.query(
    `SELECT mk.*,
            u.first_name,
            u.last_name,
            u.email,
            u.phone_number,
            u.approval_status,
            u.kyc_status,
            u.created_at AS user_created_at
     FROM merchant_kyc mk
     INNER JOIN users u ON u.id = mk.user_id
     WHERE u.kyc_status = 'submitted'
       AND u.role = 'merchant'
     ORDER BY mk.submitted_at DESC, mk.updated_at DESC`
  );

  return rows.map((row) => ({
    ...mapKyc(row),
    merchant: {
      id: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phoneNumber: row.phone_number,
      approvalStatus: row.approval_status,
      kycStatus: row.kyc_status || 'unverified',
      createdAt: row.user_created_at
    }
  }));
};

const findSubmittedByMerchantId = async (merchantId) => {
  const [rows] = await pool.query(
    `SELECT mk.*,
            u.first_name,
            u.last_name,
            u.email,
            u.phone_number,
            u.approval_status,
            u.kyc_status,
            u.created_at AS user_created_at
     FROM merchant_kyc mk
     INNER JOIN users u ON u.id = mk.user_id
     WHERE mk.user_id = ?
       AND u.kyc_status = 'submitted'
       AND u.role = 'merchant'
     LIMIT 1`,
    [merchantId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    ...mapKyc(row),
    merchant: {
      id: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phoneNumber: row.phone_number,
      approvalStatus: row.approval_status,
      kycStatus: row.kyc_status || 'unverified',
      createdAt: row.user_created_at
    }
  };
};

const create = async (userId, data = {}) => {
  const now = new Date();
  const [result] = await pool.execute(
    `INSERT INTO merchant_kyc
       (user_id, status, form_data, draft_data, draft_current_step, draft_saved_at,
        submitted_at, approved_at, approved_by, rejected_at, rejected_by, rejection_reason,
        created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.status || 'not_started',
      serializeFieldValue('formData', data.formData ?? null),
      serializeFieldValue('draftData', data.draftData ?? null),
      data.draftCurrentStep ?? null,
      data.draftSavedAt ?? null,
      data.submittedAt ?? null,
      data.approvedAt ?? null,
      data.approvedBy ?? null,
      data.rejectedAt ?? null,
      data.rejectedBy ?? null,
      data.rejectionReason ?? null,
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
      values.push(serializeFieldValue(key, data[key]));
    }
  }

  if (sets.length === 0) return findById(id);

  sets.push('`updated_at` = ?');
  values.push(new Date());
  values.push(id);

  await pool.query(`UPDATE merchant_kyc SET ${sets.join(', ')} WHERE id = ?`, values);
  return findById(id);
};

const upsertForUser = async (userId, data) => {
  const existing = await findByUserId(userId);
  if (existing) {
    return update(existing.id, data);
  }

  return create(userId, data);
};

module.exports = {
  findByUserId,
  findById,
  findSubmitted,
  findSubmittedByMerchantId,
  create,
  update,
  upsertForUser
};
