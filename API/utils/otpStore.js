const crypto = require('crypto');

const store = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const createSignupOtpSession = (signupData) => {
  const otpSessionId = crypto.randomUUID();
  const otp = generateOtp();

  store.set(otpSessionId, {
    type: 'signup',
    email: signupData.email,
    signupData,
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  return { otpSessionId, otp };
};

const getOtpSession = (otpSessionId) => {
  const session = store.get(otpSessionId);

  if (!session) {
    return null;
  }

  if (Date.now() > session.expiresAt) {
    store.delete(otpSessionId);
    return null;
  }

  return session;
};

const verifyOtpSession = (otpSessionId, otp) => {
  const session = getOtpSession(otpSessionId);

  if (!session) {
    return { valid: false, message: 'OTP session expired. Please sign up again.' };
  }

  if (session.otp !== otp) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }

  if (session.type !== 'signup' || !session.signupData) {
    return { valid: false, message: 'OTP session expired. Please sign up again.' };
  }

  store.delete(otpSessionId);

  return {
    valid: true,
    type: 'signup',
    signupData: session.signupData,
  };
};

const createPasswordResetOtpSession = ({ userId, email, fullName }) => {
  const otpSessionId = crypto.randomUUID();
  const otp = generateOtp();

  store.set(otpSessionId, {
    type: 'password_reset',
    userId,
    email,
    fullName,
    otp,
    otpVerified: false,
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  return { otpSessionId, otp };
};

const verifyPasswordResetOtp = (otpSessionId, otp) => {
  const session = getOtpSession(otpSessionId);

  if (!session) {
    return { valid: false, message: 'OTP session expired. Please request a new code.' };
  }

  if (session.type !== 'password_reset') {
    return { valid: false, message: 'Invalid reset session. Please try again.' };
  }

  if (session.otp !== otp) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }

  session.otpVerified = true;
  session.expiresAt = Date.now() + OTP_TTL_MS;

  return {
    valid: true,
    type: 'password_reset',
    userId: session.userId,
    email: session.email,
  };
};

const consumePasswordResetSession = (otpSessionId) => {
  const session = getOtpSession(otpSessionId);

  if (!session || session.type !== 'password_reset' || !session.otpVerified) {
    return null;
  }

  store.delete(otpSessionId);
  return session;
};

const resendOtpSession = (otpSessionId) => {
  const session = getOtpSession(otpSessionId);

  if (!session || (session.type !== 'signup' && session.type !== 'password_reset')) {
    return null;
  }

  session.otp = generateOtp();
  session.otpVerified = false;
  session.expiresAt = Date.now() + OTP_TTL_MS;

  return {
    otp: session.otp,
    email: session.email,
    type: session.type,
    fullName: session.fullName || `${session.signupData?.firstName || ''} ${session.signupData?.lastName || ''}`.trim(),
  };
};

module.exports = {
  createSignupOtpSession,
  createPasswordResetOtpSession,
  getOtpSession,
  verifyOtpSession,
  verifyPasswordResetOtp,
  consumePasswordResetSession,
  resendOtpSession,
};
