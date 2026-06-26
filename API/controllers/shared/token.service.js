const jwt = require('jsonwebtoken');
const UserSession = require('../../models/userSession.model');

const getJwtSecret = () => process.env.JWT_SECRET?.trim();

const createUserSession = async (req, userId, refreshToken) => {
  const decoded = jwt.decode(refreshToken);
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + Number(process.env.REFRESH_TOKEN_MAX_AGE));

  return UserSession.create({
    userId,
    refreshToken,
    expiresAt,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null
  });
};

const issueTokens = async (req, user) => {
  const secret = getJwtSecret();
  if (!secret) {
    const error = new Error('Server JWT configuration is missing');
    error.statusCode = 500;
    throw error;
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    secret,
    { expiresIn: process.env.EXPIRES_TOKEN?.trim() || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, role: user.role },
    secret,
    { expiresIn: process.env.REFRESH_TOKEN?.trim() || '7d' }
  );

  await createUserSession(req, user.id, refreshToken);

  return { accessToken, refreshToken };
};

module.exports = { getJwtSecret, createUserSession, issueTokens };
