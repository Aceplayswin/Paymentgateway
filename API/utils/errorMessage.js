const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EPIPE',
  'PROTOCOL_CONNECTION_LOST',
]);

function sanitizeClientErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const code = error?.code;
  const message = String(error?.message || '');

  if (
    TRANSIENT_ERROR_CODES.has(code) ||
    message.includes('ECONNRESET') ||
    message.includes('Connection lost')
  ) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  return message || fallback;
}

module.exports = {
  sanitizeClientErrorMessage,
};
