const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');
const UserSession = require('../../models/userSession.model');
const { sendRegistrationOtpEmail, sendPasswordResetOtpEmail } = require('../../utils/mailer');
const {
  createSignupOtpSession,
  createPasswordResetOtpSession,
  getOtpSession,
  verifyOtpSession,
  verifyPasswordResetOtp,
  consumePasswordResetSession,
  resendOtpSession
} = require('../../utils/otpStore');
const { generateUniqueUsername } = require('../shared/username.service');
const { getJwtSecret, issueTokens } = require('../shared/token.service');
const { serializeUser } = require('../shared/user.serializer');

const registerMerchant = async ({ firstName, lastName, email, phoneNumber, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!firstName || !lastName || !normalizedEmail || !password) {
    return {
      statusCode: 400,
      success: false,
      message: 'First name, last name, email, and password are required'
    };
  }

  const existingUser = await User.findByEmail(normalizedEmail);

  if (existingUser) {
    return {
      statusCode: 400,
      success: false,
      message: 'User already exists'
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const username = await generateUniqueUsername(firstName, lastName);

  const { otpSessionId, otp } = createSignupOtpSession({
    username,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email: normalizedEmail,
    phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
    password: hashedPassword,
    role: 'merchant',
    approvalStatus: 'pending'
  });

  let otpSentViaSmtp = false;

  try {
    const mailResult = await sendRegistrationOtpEmail(
      normalizedEmail,
      `${firstName} ${lastName}`.trim(),
      otp
    );
    otpSentViaSmtp = Boolean(mailResult?.otpSentViaSmtp);
  } catch (mailError) {
    console.error('Registration OTP email failed:', mailError.message);
  }

  return {
    statusCode: 200,
    success: true,
    message: 'OTP sent. Verify your email to complete registration.',
    data: { requiresOtp: true, otpSessionId, email: normalizedEmail, otpSentViaSmtp }
  };
};

const loginUser = async (req, { email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const user = await User.findByEmail(normalizedEmail);

  if (!user) {
    return { statusCode: 404, success: false, message: 'User not found' };
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return { statusCode: 401, success: false, message: 'Invalid Credentials' };
  }

  if (user.role === 'merchant' && !user.otpVerifiedAt) {
    return {
      statusCode: 403,
      success: false,
      message: 'Complete registration OTP verification first'
    };
  }

  if (user.role === 'merchant' && user.approvalStatus === 'rejected') {
    return {
      statusCode: 403,
      success: false,
      message: 'Merchant account was rejected by admin',
      data: { approvalStatus: user.approvalStatus, rejectionReason: user.rejectionReason || null }
    };
  }

  const { accessToken, refreshToken } = await issueTokens(req, user);
  const updatedUser = await User.update(user.id, { lastLogin: new Date() });

  return {
    statusCode: 200,
    success: true,
    message: 'Login Successful',
    data: { user: serializeUser(updatedUser), accessToken, refreshToken }
  };
};

const verifyRegistrationOtp = async ({ email, otp }) => {
  if (!email || !otp) {
    return { statusCode: 400, success: false, message: 'Email and OTP are required' };
  }

  const user = await User.findByEmailAndRole(email, 'merchant');

  if (!user) {
    return { statusCode: 404, success: false, message: 'Merchant not found' };
  }

  if (!user.otpCode || !user.otpExpiresAt) {
    return { statusCode: 400, success: false, message: 'Registration OTP not available' };
  }

  if (new Date(user.otpExpiresAt) < new Date()) {
    return {
      statusCode: 401,
      success: false,
      message: 'OTP expired. Register again or request a new OTP'
    };
  }

  if (String(otp).trim() !== String(user.otpCode).trim()) {
    return { statusCode: 401, success: false, message: 'Invalid OTP' };
  }

  const updatedUser = await User.update(user.id, {
    otpVerifiedAt: new Date(),
    otpCode: null,
    otpExpiresAt: null
  });

  return {
    statusCode: 200,
    success: true,
    message: 'OTP verified. Merchant is now waiting for admin approval',
    data: { user: serializeUser(updatedUser) }
  };
};

const verifyOtpAndCompleteSignup = async ({ otpSessionId, otp }) => {
  if (!otpSessionId || !otp) {
    return { statusCode: 400, success: false, message: 'OTP session and OTP are required' };
  }

  const verification = verifyOtpSession(otpSessionId, String(otp).trim());

  if (!verification.valid) {
    return { statusCode: 401, success: false, message: verification.message };
  }

  const { signupData } = verification;

  const existingUser = await User.findByEmail(signupData.email);

  if (existingUser) {
    return { statusCode: 400, success: false, message: 'User already exists' };
  }

  const requestedAt = new Date();

  const user = await User.create({
    username: signupData.username,
    firstName: signupData.firstName,
    lastName: signupData.lastName,
    email: signupData.email,
    phoneNumber: signupData.phoneNumber,
    password: signupData.password,
    role: 'merchant',
    approvalStatus: 'pending',
    approvalRequestedAt: requestedAt,
    otpVerifiedAt: requestedAt
  });

  return {
    statusCode: 200,
    success: true,
    message: 'OTP verified. Approval request sent to admin',
    data: { user: serializeUser(user) }
  };
};

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const requestPasswordReset = async ({ email }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return { statusCode: 400, success: false, message: 'Email is required' };
  }

  const user = await User.findByEmail(normalizedEmail);

  if (user) {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const { otpSessionId, otp } = createPasswordResetOtpSession({
      userId: user.id,
      email: normalizedEmail,
      fullName
    });

    try {
      await sendPasswordResetOtpEmail(normalizedEmail, fullName, otp);
    } catch (mailError) {
      console.error('Password reset OTP email failed:', mailError.message);
    }

    return {
      statusCode: 200,
      success: true,
      message: 'If this email exists, a verification code has been sent.',
      data: { requiresOtp: true, otpSessionId, email: normalizedEmail }
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: 'If this email exists, a verification code has been sent.',
    data: { email: normalizedEmail }
  };
};

const verifyResetOtp = async ({ otpSessionId, otp }) => {
  if (!otpSessionId || !otp) {
    return { statusCode: 400, success: false, message: 'OTP session and OTP are required' };
  }

  const verification = verifyPasswordResetOtp(otpSessionId, String(otp).trim());

  if (!verification.valid) {
    return { statusCode: 401, success: false, message: verification.message };
  }

  return {
    statusCode: 200,
    success: true,
    message: 'OTP verified. You can now set a new password.',
    data: { otpSessionId, email: verification.email }
  };
};

const resetPassword = async ({ otpSessionId, newPassword }) => {
  if (!otpSessionId || !newPassword) {
    return { statusCode: 400, success: false, message: 'OTP session and new password are required' };
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    return {
      statusCode: 400,
      success: false,
      message: 'Password must be at least 8 characters and include both letters and numbers.'
    };
  }

  const session = consumePasswordResetSession(otpSessionId);

  if (!session) {
    return {
      statusCode: 401,
      success: false,
      message: 'Reset session expired or OTP not verified. Please start again.'
    };
  }

  const user = await User.findById(session.userId);

  if (!user) {
    return { statusCode: 404, success: false, message: 'User not found' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.update(user.id, { password: hashedPassword });
  await UserSession.revokeAllForUser(user.id);

  return {
    statusCode: 200,
    success: true,
    message: 'Password reset successful. You can now sign in with your new password.',
    data: { email: user.email }
  };
};

const resendSignupOtp = async ({ otpSessionId }) => {
  if (!otpSessionId) {
    return { statusCode: 400, success: false, message: 'OTP session is required' };
  }

  const session = getOtpSession(otpSessionId);

  if (!session || (session.type !== 'signup' && session.type !== 'password_reset')) {
    return {
      statusCode: 400,
      success: false,
      message: 'OTP session expired. Please try again.'
    };
  }

  const resent = resendOtpSession(otpSessionId);

  if (!resent) {
    return {
      statusCode: 400,
      success: false,
      message: 'OTP session expired. Please try again.'
    };
  }

  let otpSentViaSmtp = false;

  try {
    const mailResult =
      resent.type === 'password_reset'
        ? await sendPasswordResetOtpEmail(resent.email, resent.fullName, resent.otp)
        : await sendRegistrationOtpEmail(resent.email, resent.fullName, resent.otp);
    otpSentViaSmtp = Boolean(mailResult?.otpSentViaSmtp);
  } catch (mailError) {
    console.error('Resend OTP email failed:', mailError.message);
  }

  return {
    statusCode: 200,
    success: true,
    message: 'A new verification code has been sent.',
    data: { email: resent.email, otpSentViaSmtp }
  };
};

const refreshAccessToken = async (token) => {
  if (!token) {
    return { statusCode: 401, success: false, message: 'Refresh token required in body or cookie' };
  }

  const secret = getJwtSecret();
  if (!secret) {
    return { statusCode: 500, success: false, message: 'Server JWT configuration is missing' };
  }

  try {
    const decoded = jwt.verify(token, secret);

    const session = await UserSession.findActiveSession({
      refreshToken: token,
      userId: decoded.id
    });

    if (!session || new Date(session.expiresAt) < new Date()) {
      return {
        statusCode: 401,
        success: false,
        message: 'Refresh session invalid or expired. Please login again'
      };
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return { statusCode: 404, success: false, message: 'User not found' };
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      { expiresIn: process.env.EXPIRES_TOKEN?.trim() || '15m' }
    );

    await UserSession.updateLastUsed(session.id);

    return {
      statusCode: 200,
      success: true,
      message: 'Token refreshed',
      data: { accessToken, user: serializeUser(user) }
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        success: false,
        message: 'Refresh token expired. Please login again'
      };
    }

    return { statusCode: 401, success: false, message: 'Invalid refresh token' };
  }
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    return { statusCode: 404, success: false, message: 'User not found' };
  }

  return {
    statusCode: 200,
    success: true,
    data: { user: serializeUser(user) }
  };
};

module.exports = {
  registerMerchant,
  loginUser,
  verifyRegistrationOtp,
  verifyOtpAndCompleteSignup,
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
  resendSignupOtp,
  refreshAccessToken,
  getCurrentUser
};
