const pool = require('../config/db');
const { parseProviderConfig } = require('../controllers/payment/payment.shared');

const mapConfig = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    gatewayProvider: row.gateway_provider,
    merchantName: row.merchant_name,
    merchantPhone: row.merchant_phone,
    externalMerchantId: row.phonepe_merchant_id,
    phonepeMerchantId: row.phonepe_merchant_id,
    clientId: row.client_id,
    clientSecret: row.client_secret,
    clientVersion: row.client_version,
    environment: row.environment,
    redirectUrl: row.redirect_url,
    webhookUsername: row.webhook_username,
    webhookPassword: row.webhook_password,
    providerConfig: parseProviderConfig(row.provider_config),
    status: row.status,
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const FIELD_MAP = {
  merchantName: 'merchant_name',
  merchantPhone: 'merchant_phone',
  phonepeMerchantId: 'phonepe_merchant_id',
  externalMerchantId: 'phonepe_merchant_id',
  clientId: 'client_id',
  clientSecret: 'client_secret',
  clientVersion: 'client_version',
  environment: 'environment',
  redirectUrl: 'redirect_url',
  webhookUsername: 'webhook_username',
  webhookPassword: 'webhook_password',
  status: 'status',
  activatedAt: 'activated_at'
};

const findByUserId = async (userId, gatewayProvider) => {
  let sql = 'SELECT * FROM merchant_gateway_configs WHERE user_id = ?';
  const values = [userId];

  if (gatewayProvider) {
    sql += ' AND gateway_provider = ?';
    values.push(gatewayProvider);
  }

  sql += ' LIMIT 1';
  const [rows] = await pool.execute(sql, values);
  return mapConfig(rows[0]);
};

const listByUserId = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM merchant_gateway_configs WHERE user_id = ? ORDER BY gateway_provider ASC',
    [userId]
  );
  return rows.map(mapConfig);
};

const findActiveByUserId = async (userId, gatewayProvider) => {
  const [rows] = await pool.execute(
    `SELECT * FROM merchant_gateway_configs
     WHERE user_id = ? AND gateway_provider = ? AND status = 'active' LIMIT 1`,
    [userId, gatewayProvider]
  );
  return mapConfig(rows[0]);
};

const create = async (data) => {
  const now = new Date();
  const providerConfig = data.providerConfig
    ? JSON.stringify(data.providerConfig)
    : null;

  const [result] = await pool.execute(
    `INSERT INTO merchant_gateway_configs
       (user_id, gateway_provider, merchant_name, merchant_phone, phonepe_merchant_id,
        client_id, client_secret, client_version, environment, redirect_url,
        webhook_username, webhook_password, provider_config, status, activated_at,
        created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.userId,
      data.gatewayProvider || 'razorpay',
      data.merchantName,
      data.merchantPhone,
      data.externalMerchantId || data.phonepeMerchantId || null,
      data.clientId,
      data.clientSecret,
      data.clientVersion ?? 1,
      data.environment || 'sandbox',
      data.redirectUrl,
      data.webhookUsername || null,
      data.webhookPassword || null,
      providerConfig,
      data.status || 'active',
      data.status === 'active' ? now : null,
      now,
      now
    ]
  );
  return findById(result.insertId);
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM merchant_gateway_configs WHERE id = ? LIMIT 1',
    [id]
  );
  return mapConfig(rows[0]);
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

  if (Object.prototype.hasOwnProperty.call(data, 'providerConfig')) {
    sets.push('`provider_config` = ?');
    values.push(data.providerConfig ? JSON.stringify(data.providerConfig) : null);
  }

  if (sets.length === 0) return findById(id);

  sets.push('`updated_at` = ?');
  values.push(new Date());
  values.push(id);

  await pool.query(
    `UPDATE merchant_gateway_configs SET ${sets.join(', ')} WHERE id = ?`,
    values
  );
  return findById(id);
};

const upsertForUser = async (userId, gatewayProvider, data) => {
  const existing = await findByUserId(userId, gatewayProvider);
  if (existing) {
    return update(existing.id, data);
  }
  return create({ ...data, userId, gatewayProvider });
};

module.exports = {
  findById,
  findByUserId,
  listByUserId,
  findActiveByUserId,
  create,
  update,
  upsertForUser
};
