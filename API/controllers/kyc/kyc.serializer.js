const { mapAccountStatus, mapKycStatusForClient } = require('../shared/user.serializer');

const serializeKycRecord = (kyc, merchant) => {
  const userKycStatus = merchant?.kycStatus || 'unverified';
  const clientKycStatus = mapKycStatusForClient(userKycStatus);

  if (!kyc) {
    return {
      id: null,
      userId: merchant?.id ?? null,
      status: null,
      kycStatus: clientKycStatus,
      userKycStatus,
      formData: null,
      kycData: null,
      draftData: null,
      kycDraft: null,
      draftCurrentStep: null,
      draftSavedAt: null,
      submittedAt: null,
      kycSubmittedAt: null,
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      kycRejectionReason: null,
      createdAt: null,
      updatedAt: null,
      merchant: merchant
        ? {
            id: merchant.id,
            merchantId: merchant.id,
            merchantCode: `MRC${merchant.id}`,
            firstName: merchant.firstName,
            lastName: merchant.lastName,
            email: merchant.email,
            phoneNumber: merchant.phoneNumber,
            accountStatus: mapAccountStatus(merchant.approvalStatus),
            approvalStatus: merchant.approvalStatus,
            userKycStatus,
            kycStatus: clientKycStatus
          }
        : null
    };
  }

  return {
    id: kyc.id,
    userId: kyc.userId,
    status: kyc.status,
    kycStatus: clientKycStatus,
    userKycStatus,
    formData: kyc.formData,
    kycData: kyc.formData,
    draftData: kyc.draftData,
    kycDraft: kyc.draftData
      ? {
          currentStep: kyc.draftCurrentStep,
          formData: kyc.draftData,
          savedAt: kyc.draftSavedAt
        }
      : null,
    draftCurrentStep: kyc.draftCurrentStep,
    draftSavedAt: kyc.draftSavedAt,
    submittedAt: kyc.submittedAt,
    kycSubmittedAt: kyc.submittedAt,
    approvedAt: kyc.approvedAt,
    approvedBy: kyc.approvedBy,
    rejectedAt: kyc.rejectedAt,
    rejectedBy: kyc.rejectedBy,
    rejectionReason: kyc.rejectionReason,
    kycRejectionReason: kyc.rejectionReason,
    createdAt: kyc.createdAt,
    updatedAt: kyc.updatedAt,
    merchant: merchant
      ? {
          id: merchant.id,
          merchantId: merchant.id,
          merchantCode: `MRC${merchant.id}`,
          firstName: merchant.firstName,
          lastName: merchant.lastName,
          email: merchant.email,
          phoneNumber: merchant.phoneNumber,
          accountStatus: mapAccountStatus(merchant.approvalStatus),
          approvalStatus: merchant.approvalStatus,
          userKycStatus,
          kycStatus: clientKycStatus
        }
      : null
  };
};

const serializeMerchantOnboarding = (merchant, kyc) => {
  const userKycStatus = merchant?.kycStatus || 'unverified';

  return {
    userId: String(merchant.id),
    email: merchant.email,
    firstName: merchant.firstName,
    lastName: merchant.lastName,
    phoneNumber: merchant.phoneNumber,
    accountStatus: mapAccountStatus(merchant.approvalStatus),
    userKycStatus,
    kycStatus: mapKycStatusForClient(userKycStatus),
    kycData: kyc?.formData ?? null,
    kycDraft: kyc?.draftData
      ? {
          currentStep: kyc.draftCurrentStep,
          formData: kyc.draftData,
          savedAt: kyc.draftSavedAt
        }
      : null,
    registeredAt: merchant.createdAt,
    kycSubmittedAt: kyc?.submittedAt ?? null,
    kycApprovedAt: kyc?.approvedAt ?? null,
    kycRejectionReason: kyc?.rejectionReason ?? null,
    kycRejectedAt: kyc?.rejectedAt ?? null
  };
};

const serializeSubmittedKycRequest = (entry) => {
  const merchant = entry.merchant || {};
  const merchantName = `${merchant.firstName || ''} ${merchant.lastName || ''}`.trim();
  const userKycStatus = merchant.kycStatus || 'submitted';

  return {
    merchantId: merchant.id,
    merchantCode: `MRC${merchant.id}`,
    merchantName: merchantName || merchant.email,
    email: merchant.email,
    phoneNumber: merchant.phoneNumber,
    businessType: entry.formData?.business?.businessType || null,
    userKycStatus,
    kycStatus: mapKycStatusForClient(userKycStatus),
    submittedAt: entry.submittedAt,
    accountStatus: mapAccountStatus(merchant.approvalStatus),
    kycData: entry.formData
  };
};

module.exports = {
  serializeKycRecord,
  serializeMerchantOnboarding,
  serializeSubmittedKycRequest
};
