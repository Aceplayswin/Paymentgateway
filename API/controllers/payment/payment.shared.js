const { randomUUID } = require('crypto');
const { MIN_AMOUNT_PAISE } = require('./payment.constants');

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);

const toE164Phone = (phone) => {
  const normalized = normalizePhone(phone);
  return normalized ? `+91${normalized}` : '';
};

const validatePhone = (phone) => /^[6-9]\d{9}$/.test(normalizePhone(phone));

const mapGatewayStateToPayinStatus = (state) => {
  const normalized = String(state || '').toUpperCase();
  if (['COMPLETED', 'SUCCESS', 'TXN_SUCCESS', 'PAID'].includes(normalized)) return 'success';
  if (['FAILED', 'FAILURE', 'TXN_FAILURE', 'DECLINED', 'EXPIRED'].includes(normalized)) {
    return 'failed';
  }
  return 'pending';
};

const resolveMerchantUserId = (req, bodyMerchantId) => {
  if (req.user.role === 'admin' && bodyMerchantId) {
    return parseInt(bodyMerchantId, 10);
  }
  return req.user.id;
};

const buildMerchantOrderId = (customOrderId, prefix = 'ORD') => {
  if (customOrderId) {
    return String(customOrderId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 63);
  }
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
};

const parseProviderConfig = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const validatePaymentInput = (body) => {
  const { customerName, customerPhone, amount } = body;

  if (!customerName || !customerPhone || amount == null) {
    return {
      error: {
        statusCode: 400,
        success: false,
        message: 'customerName, customerPhone, and amount are required'
      }
    };
  }

  if (!validatePhone(customerPhone)) {
    return {
      error: {
        statusCode: 400,
        success: false,
        message: 'customerPhone must be a valid 10-digit Indian mobile number'
      }
    };
  }

  const amountInr = Number(amount);
  if (Number.isNaN(amountInr) || amountInr <= 0) {
    return {
      error: {
        statusCode: 400,
        success: false,
        message: 'amount must be a positive number'
      }
    };
  }

  const amountPaise = Math.round(amountInr * 100);
  if (amountPaise < MIN_AMOUNT_PAISE) {
    return {
      error: {
        statusCode: 400,
        success: false,
        message: `Minimum payment amount is INR ${MIN_AMOUNT_PAISE / 100}`
      }
    };
  }

  return {
    customerName: String(customerName).trim(),
    customerPhone: normalizePhone(customerPhone),
    amountInr,
    amountPaise
  };
};

module.exports = {
  normalizePhone,
  toE164Phone,
  validatePhone,
  mapGatewayStateToPayinStatus,
  resolveMerchantUserId,
  buildMerchantOrderId,
  parseProviderConfig,
  validatePaymentInput
};
