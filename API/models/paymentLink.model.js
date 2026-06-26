const crypto = require('crypto');
const pool = require('../config/db');

// Hosted-payment-page link tokens. Ported from the PHP `payment_links` table.
// A token maps to an order and expires 5 minutes after creation (enforced in
// findValidByToken), mirroring pay_now.php's TTL check.

const LINK_TTL_MS = 5 * 60 * 1000;

const mapRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    linkToken: row.link_token,
    orderId: row.order_id,
    createdAt: row.created_at
  };
};

// PHP: hash('sha256', time().random_bytes(16).rand()).
const generateLinkToken = () =>
  crypto
    .createHash('sha256')
    .update(`${Date.now()}${crypto.randomBytes(16).toString('hex')}${Math.random()}`)
    .digest('hex');

const create = async (orderId) => {
  const linkToken = generateLinkToken();
  await pool.execute(
    'INSERT INTO payment_links (link_token, order_id, created_at) VALUES (?, ?, ?)',
    [linkToken, orderId, new Date()]
  );
  return { linkToken, orderId };
};

// Returns the link only if it exists and is within the 5-minute TTL.
const findValidByToken = async (linkToken) => {
  const [rows] = await pool.execute(
    'SELECT * FROM payment_links WHERE link_token = ? LIMIT 1',
    [linkToken]
  );
  const link = mapRow(rows[0]);
  if (!link) return { link: null, expired: false };

  const ageMs = Date.now() - new Date(link.createdAt).getTime();
  if (ageMs > LINK_TTL_MS) {
    return { link, expired: true };
  }
  return { link, expired: false };
};

module.exports = { create, findValidByToken, generateLinkToken, LINK_TTL_MS };
