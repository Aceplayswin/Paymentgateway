const User = require('../../models/user.model');
const {
  serializeApprovedMerchant,
  serializePendingMerchantRequest,
  serializeRejectedMerchant,
  serializeMerchantRequest
} = require('../shared/user.serializer');

const getPendingMerchants = async () => {
  const merchants = await User.findMerchants('pending');
  return {
    statusCode: 200,
    success: true,
    data: { count: merchants.length, pendingRequests: merchants.map(serializePendingMerchantRequest) }
  };
};

const getApprovedMerchants = async () => {
  const merchants = await User.findMerchants('approved');
  return {
    statusCode: 200,
    success: true,
    data: { count: merchants.length, approvedMerchants: merchants.map(serializeApprovedMerchant) }
  };
};

const getMerchantAccounts = async () => {
  const [approvedMerchants, pendingRequests, rejectedMerchants] = await Promise.all([
    User.findMerchants('approved'),
    User.findMerchants('pending'),
    User.findMerchants('rejected')
  ]);

  return {
    statusCode: 200,
    success: true,
    data: {
      approvedMerchants: {
        count: approvedMerchants.length,
        merchants: approvedMerchants.map(serializeApprovedMerchant)
      },
      pendingRequests: {
        count: pendingRequests.length,
        requests: pendingRequests.map(serializePendingMerchantRequest)
      },
      rejectedMerchants: {
        count: rejectedMerchants.length,
        merchants: rejectedMerchants.map(serializeRejectedMerchant)
      }
    }
  };
};

const getMerchantApprovalRequests = async (status = 'pending') => {
  const normalizedStatus = String(status || 'pending').trim().toLowerCase();
  const allowedStatuses = ['pending', 'approved', 'rejected', 'all'];

  if (!allowedStatuses.includes(normalizedStatus)) {
    return {
      statusCode: 400,
      success: false,
      message: 'Invalid status. Use pending, approved, rejected, or all'
    };
  }

  if (normalizedStatus === 'all') return getMerchantAccounts();
  if (normalizedStatus === 'approved') return getApprovedMerchants();

  const merchants = await User.findMerchants(normalizedStatus);

  if (normalizedStatus === 'rejected') {
    return {
      statusCode: 200,
      success: true,
      data: {
        status: normalizedStatus,
        count: merchants.length,
        rejectedMerchants: merchants.map(serializeRejectedMerchant)
      }
    };
  }

  return {
    statusCode: 200,
    success: true,
    data: {
      status: normalizedStatus,
      count: merchants.length,
      pendingRequests: merchants.map(serializePendingMerchantRequest)
    }
  };
};

const getMerchantApprovalRequest = async (merchantId) => {
  const merchant = await User.findMerchantById(merchantId);

  if (!merchant) {
    return { statusCode: 404, success: false, message: 'Merchant approval request not found' };
  }

  return {
    statusCode: 200,
    success: true,
    data: { request: serializeMerchantRequest(merchant) }
  };
};

const approveMerchant = async (merchantId, adminUserId) => {
  const merchant = await User.findMerchantById(merchantId);

  if (!merchant) {
    return { statusCode: 404, success: false, message: 'Merchant not found' };
  }

  if (!merchant.otpVerifiedAt) {
    return { statusCode: 400, success: false, message: 'Merchant email OTP is not verified yet' };
  }

  if (merchant.approvalStatus === 'approved') {
    return { statusCode: 400, success: false, message: 'Merchant is already approved' };
  }

  if (merchant.approvalStatus !== 'pending') {
    return {
      statusCode: 400,
      success: false,
      message: 'Only pending merchant requests can be approved'
    };
  }

  const updated = await User.update(merchant.id, {
    approvalStatus: 'approved',
    approvedAt: new Date(),
    approvedBy: adminUserId,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null
  });

  return {
    statusCode: 200,
    success: true,
    message: 'Merchant approved successfully',
    data: { merchant: serializeApprovedMerchant(updated) }
  };
};

const rejectMerchant = async (merchantId, adminUserId, reason) => {
  const merchant = await User.findMerchantById(merchantId);

  if (!merchant) {
    return { statusCode: 404, success: false, message: 'Merchant not found' };
  }

  if (!merchant.otpVerifiedAt) {
    return { statusCode: 400, success: false, message: 'Merchant email OTP is not verified yet' };
  }

  if (merchant.approvalStatus === 'approved') {
    return { statusCode: 400, success: false, message: 'Approved merchants cannot be rejected' };
  }

  if (merchant.approvalStatus === 'rejected') {
    return { statusCode: 400, success: false, message: 'Merchant is already rejected' };
  }

  if (merchant.approvalStatus !== 'pending') {
    return {
      statusCode: 400,
      success: false,
      message: 'Only pending merchant requests can be rejected'
    };
  }

  const updated = await User.update(merchant.id, {
    approvalStatus: 'rejected',
    rejectedAt: new Date(),
    rejectedBy: adminUserId,
    rejectionReason: reason ? String(reason).trim().slice(0, 500) : null,
    approvedAt: null,
    approvedBy: null
  });

  return {
    statusCode: 200,
    success: true,
    message: 'Merchant rejected successfully',
    data: { merchant: serializeRejectedMerchant(updated) }
  };
};

module.exports = {
  getPendingMerchants,
  getApprovedMerchants,
  getMerchantAccounts,
  getMerchantApprovalRequests,
  getMerchantApprovalRequest,
  approveMerchant,
  rejectMerchant
};
