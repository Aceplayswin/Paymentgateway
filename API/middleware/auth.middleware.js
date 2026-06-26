const jwt = require('jsonwebtoken');
const { extractAccessToken } = require('../utils/extractAccessToken');

const getJwtSecret = () => process.env.JWT_SECRET?.trim();

exports.authenticate = (req, res, next) => {
  const token = extractAccessToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Use Authorization: Bearer <accessToken>'
    });
  }

  const secret = getJwtSecret();
  if (!secret) {
    return res.status(500).json({
      success: false,
      message: 'Server JWT configuration is missing'
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Login again or call POST /api/auth/refresh with your refreshToken'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token. Send accessToken from login (not refreshToken with typos). Header: Bearer <token>'
    });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  return next();
};
