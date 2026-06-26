const JWT_PATTERN = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

const stripQuotes = (value) => value.replace(/^["']|["']$/g, '').trim();

const extractFromAuthorization = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  let value = stripQuotes(String(authHeader).trim());

  while (/^bearer\s+/i.test(value)) {
    value = value.replace(/^bearer\s+/i, '').trim();
  }

  value = stripQuotes(value);

  if (JWT_PATTERN.test(value)) {
    return value;
  }

  const match = value.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
  return match ? match[0] : null;
};

exports.extractAccessToken = (req) => {
  const authHeader =
    req.headers.authorization ||
    req.headers.Authorization ||
    req.get?.('authorization');

  const fromHeader = extractFromAuthorization(authHeader);
  if (fromHeader) {
    return fromHeader;
  }

  const altHeader = req.headers['x-access-token'];
  if (altHeader) {
    return extractFromAuthorization(altHeader);
  }

  return null;
};
