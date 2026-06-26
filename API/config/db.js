const mysql = require('mysql2/promise');
require('dotenv').config();

const TRANSIENT_DB_ERRORS = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EPIPE',
  'PROTOCOL_CONNECTION_LOST',
  'ER_CON_COUNT_ERROR',
]);

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60_000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10_000,
  decimalNumbers: true,
});

function isTransientDbError(error) {
  if (!error) {
    return false;
  }

  if (TRANSIENT_DB_ERRORS.has(error.code)) {
    return true;
  }

  const message = String(error.message || '');
  return message.includes('ECONNRESET') || message.includes('Connection lost');
}

async function withRetry(operation) {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientDbError(error)) {
      throw error;
    }

    return operation();
  }
}

module.exports = {
  execute: (...args) => withRetry(() => pool.execute(...args)),
  query: (...args) => withRetry(() => pool.query(...args)),
  getConnection: () => withRetry(() => pool.getConnection()),
  pool,
};
