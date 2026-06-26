const pool = require('../config/db');

// Status registry for the platform's acquiring gateways. Credentials now live in
// the environment (see config/gatewayCredentials.js) — this table only records
// WHICH gateway the admin has activated. One row per provider, enforced by the
// (gateway_provider, singleton) unique key. The credential columns on this table
// are legacy and are no longer read or written.

const { RAZORPAY } = require('../config/gatewayCredentials');

// Bare status view of a row (no secrets — there are none here anymore).
const mapStatus = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    gatewayProvider: row.gateway_provider,
    status: row.status,
    activatedAt: row.activated_at,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// Status row for a single provider (no credentials).
const findByProvider = async (provider = RAZORPAY) => {
  const [rows] = await pool.execute(
    'SELECT * FROM platform_gateway_configs WHERE gateway_provider = ? LIMIT 1',
    [provider]
  );
  return mapStatus(rows[0]);
};

// All status rows (one per provider that has ever been touched).
const findAll = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM platform_gateway_configs ORDER BY gateway_provider ASC'
  );
  return rows.map(mapStatus);
};

// The currently active gateway provider, or null. Used by the payment flow to
// know which acquiring gateway to route through.
const findActiveProvider = async () => {
  const [rows] = await pool.execute(
    "SELECT gateway_provider FROM platform_gateway_configs WHERE status = 'active' LIMIT 1"
  );
  return rows[0]?.gateway_provider || null;
};

// Sets a provider's status, creating the status row on first use. Credential
// columns are left NULL — credentials come from the environment.
const setStatus = async (provider, status, updatedBy = null) => {
  const existing = await findByProvider(provider);
  const now = new Date();
  const activatedAt = status === 'active' ? existing?.activatedAt || now : existing?.activatedAt || null;

  if (existing) {
    await pool.query(
      `UPDATE platform_gateway_configs
         SET status = ?, activated_at = ?, updated_by = ?, updated_at = ?
       WHERE id = ?`,
      [status, activatedAt, updatedBy, now, existing.id]
    );
  } else {
    await pool.execute(
      `INSERT INTO platform_gateway_configs
         (gateway_provider, singleton, status, activated_at, updated_by, created_at, updated_at)
       VALUES (?, 'singleton', ?, ?, ?, ?, ?)`,
      [provider, status, activatedAt, updatedBy, now, now]
    );
  }
  return findByProvider(provider);
};

module.exports = {
  RAZORPAY,
  mapStatus,
  findByProvider,
  findAll,
  findActiveProvider,
  setStatus
};
