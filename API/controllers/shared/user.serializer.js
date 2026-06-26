const mapAccountStatus = (approvalStatus) => {
  if (approvalStatus === 'approved') {
    return 'approved';
  }

  if (approvalStatus === 'rejected') {
    return 'rejected';
  }

  return 'pending_review';
};

const mapKycStatusForClient = (userKycStatus) => {
  if (userKycStatus === 'verified') return 'approved';
  if (userKycStatus === 'submitted') return 'submitted';
  return 'not_started';
};

const serializeKycFields = (user) => {
  const userKycStatus = user?.kycStatus || 'unverified';

  return {
    userKycStatus,
    kycStatus: mapKycStatusForClient(userKycStatus)
  };
};

const serializeUser = (user) => ({
  id: user.id,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  lastLogin: user.lastLogin,
  phoneNumber: user.phoneNumber,
  email: user.email,
  role: user.role || 'merchant',
  accountStatus: mapAccountStatus(user.approvalStatus),
  approvalStatus: user.approvalStatus || 'pending',
  ...serializeKycFields(user),
  approvalRequestedAt: user.approvalRequestedAt,
  approvedAt: user.approvedAt,
  approvedBy: user.approvedBy,
  rejectedAt: user.rejectedAt,
  rejectedBy: user.rejectedBy,
  rejectionReason: user.rejectionReason,
  otpVerifiedAt: user.otpVerifiedAt,
  createdAt: user.createdAt
});

const serializeMerchantBase = (user) => ({
  merchantId: user.id,
  merchantCode: `MRC${user.id}`,
  id: user.id,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role || 'merchant',
  accountStatus: mapAccountStatus(user.approvalStatus),
  approvalStatus: user.approvalStatus || 'pending',
  ...serializeKycFields(user),
  otpVerifiedAt: user.otpVerifiedAt,
  createdAt: user.createdAt
});

const serializeApprovedMerchant = (user) => ({
  ...serializeMerchantBase(user),
  approvedAt: user.approvedAt,
  approvedBy: user.approvedBy
});

const serializePendingMerchantRequest = (user) => ({
  ...serializeMerchantBase(user),
  approvalRequestedAt: user.approvalRequestedAt
});

const serializeRejectedMerchant = (user) => ({
  ...serializeMerchantBase(user),
  approvalRequestedAt: user.approvalRequestedAt,
  rejectedAt: user.rejectedAt,
  rejectedBy: user.rejectedBy,
  rejectionReason: user.rejectionReason
});

const serializeMerchantRequest = (user) => {
  const status = user.approvalStatus || 'pending';

  if (status === 'approved') {
    return serializeApprovedMerchant(user);
  }

  if (status === 'rejected') {
    return serializeRejectedMerchant(user);
  }

  return serializePendingMerchantRequest(user);
};

module.exports = {
  mapAccountStatus,
  mapKycStatusForClient,
  serializeKycFields,
  serializeUser,
  serializeMerchantBase,
  serializeApprovedMerchant,
  serializePendingMerchantRequest,
  serializeRejectedMerchant,
  serializeMerchantRequest
};
