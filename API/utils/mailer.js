const nodemailer = require('nodemailer');

const isSmtpConfigured = () =>
  Boolean(
    process.env.SMTP_HOST && 
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );

let transporter;

const getSmtpPort = () => Number(process.env.SMTP_PORT) || 587;

const getSmtpSecure = (port) => {
  if (port === 465) {
    return true;
  }

  if (port === 587 || port === 25) {
    return false;
  }

  return process.env.SMTP_SECURE === 'true';
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!isSmtpConfigured()) {
    return null;
  }

  const port = getSmtpPort();
  const secure = getSmtpSecure(port);

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.replace(/\s/g, '')
    }
  });

  return transporter;
};

const sendRegistrationEmail = async (to, fullName) => {
  const mailer = getTransporter();

  if (!mailer) {
    console.warn('SMTP is not configured. Skipping registration email.');
    return;
  }

  const appName = process.env.APP_NAME || 'Payment Gateway System';
  const displayName = fullName || 'User';

  await mailer.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Welcome to ${appName}`,
    text: `Hi ${displayName}, your account has been created successfully.`,
    html: `<p>Hi ${displayName},</p><p>Your account has been created successfully.</p><p>Welcome to ${appName}.</p>`
  });
};

const sendRegistrationOtpEmail = async (to, fullName, otpCode) => {
  const mailer = getTransporter();

  if (!mailer) {
    console.warn('SMTP is not configured. Skipping registration OTP email.');
    return { otpSentViaSmtp: false };
  }

  const appName = process.env.APP_NAME || 'Payment Gateway System';
  const displayName = fullName || 'User';

  await mailer.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `${appName} registration OTP`,
    text: `Hi ${displayName}, your OTP is ${otpCode}. It expires in 5 minutes.`,
    html: `<p>Hi ${displayName},</p><p>Your OTP is <strong>${otpCode}</strong>.</p><p>This OTP expires in 5 minutes.</p>`
  });

  return { otpSentViaSmtp: true };
};

const sendPasswordResetOtpEmail = async (to, fullName, otpCode) => {
  const mailer = getTransporter();

  if (!mailer) {
    console.warn('SMTP is not configured. Skipping password reset OTP email.');
    return { otpSentViaSmtp: false };
  }

  const appName = process.env.APP_NAME || 'Payment Gateway System';
  const displayName = fullName || 'User';

  await mailer.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `${appName} password reset OTP`,
    text: `Hi ${displayName}, your password reset OTP is ${otpCode}. It expires in 5 minutes.`,
    html: `<p>Hi ${displayName},</p><p>Your password reset OTP is <strong>${otpCode}</strong>.</p><p>This OTP expires in 5 minutes. If you did not request this, you can ignore this email.</p>`
  });

  return { otpSentViaSmtp: true };
};

module.exports = {
  sendRegistrationEmail,
  sendRegistrationOtpEmail,
  sendPasswordResetOtpEmail
};
