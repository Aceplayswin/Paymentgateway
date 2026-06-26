const bcrypt = require('bcrypt');
const User = require('../../models/user.model');
const { serializeMerchantRequest } = require('../shared/user.serializer');

const authenticateMerchant = async ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return { statusCode: 400, success: false, message: 'Email and password are required' };
  }

  const merchant = await User.findByEmailAndRole(normalizedEmail, 'merchant');

  if (!merchant) {
    return { statusCode: 404, success: false, message: 'Merchant not found' };
  }

  const isMatch = await bcrypt.compare(password, merchant.password);

  if (!isMatch) {
    return { statusCode: 401, success: false, message: 'Invalid credentials' };
  }

  return { merchant };
};

const submitApprovalRequest = async ({ email, password, note }) => {
  const authResult = await authenticateMerchant({ email, password });

  if (authResult.statusCode) return authResult;

  const { merchant } = authResult;

  if (!merchant.otpVerifiedAt) {
    return {
      statusCode: 400,
      success: false,
      message: 'Complete registration OTP verification first'
    };
  }

  if (merchant.approvalStatus === 'approved') {
    return { statusCode: 400, success: false, message: 'Merchant account is already approved' };
  }

  if (merchant.approvalStatus === 'pending') {
    return {
      statusCode: 200,
      success: true,
      message: 'Approval request is already pending admin review',
      data: { request: serializeMerchantRequest(merchant) }
    };
  }

  const updated = await User.update(merchant.id, {
    approvalStatus: 'pending',
    approvalRequestedAt: new Date(),
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: note ? String(note).trim().slice(0, 500) : null,
    approvedAt: null,
    approvedBy: null
  });

  return {
    statusCode: 200,
    success: true,
    message: 'Approval request submitted to admin',
    data: { request: serializeMerchantRequest(updated) }
  };
};

const getApprovalStatus = async ({ email, password }) => {
  const authResult = await authenticateMerchant({ email, password });

  if (authResult.statusCode) return authResult;

  const { merchant } = authResult;

  return {
    statusCode: 200,
    success: true,
    data: { request: serializeMerchantRequest(merchant) }
  };
};

module.exports = { authenticateMerchant, submitApprovalRequest, getApprovalStatus };
