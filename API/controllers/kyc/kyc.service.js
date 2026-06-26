const User = require('../../models/user.model');
const MerchantKyc = require('../../models/merchantKyc.model');
const {
  validateAllKycSteps,
  normalizeSubmittedFormData
} = require('../../utils/kycValidation');
const { persistKycFiles, readStoredFile } = require('../../utils/kycFileStorage');
const {
  serializeKycRecord,
  serializeMerchantOnboarding,
  serializeSubmittedKycRequest
} = require('./kyc.serializer');

const getMerchantOrError = async (userId) => {
  const merchant = await User.findMerchantById(userId);

  if (!merchant) {
    return { statusCode: 404, success: false, message: 'Merchant not found' };
  }

  if (!merchant.otpVerifiedAt) {
    return {
      statusCode: 403,
      success: false,
      message: 'Verify your email OTP before submitting KYC'
    };
  }

  if (merchant.approvalStatus !== 'approved') {
    return {
      statusCode: 403,
      success: false,
      message: 'Merchant account must be approved before submitting verification details'
    };
  }

  return { merchant };
};

const ensureEditableKyc = (merchant) => {
  const status = merchant?.kycStatus || 'unverified';

  if (status === 'submitted') {
    return {
      statusCode: 400,
      success: false,
      message: 'KYC is already submitted and under admin review'
    };
  }

  if (status === 'verified') {
    return {
      statusCode: 400,
      success: false,
      message: 'KYC is already approved'
    };
  }

  return null;
};

const getMerchantKycStatus = async (userId) => {
  const merchantResult = await getMerchantOrError(userId);
  if (merchantResult.statusCode) return merchantResult;

  const kyc = await MerchantKyc.findByUserId(userId);

  return {
    statusCode: 200,
    success: true,
    data: {
      onboarding: serializeMerchantOnboarding(merchantResult.merchant, kyc),
      kyc: serializeKycRecord(kyc, merchantResult.merchant)
    }
  };
};

const saveMerchantKycDraft = async (userId, payload = {}) => {
  const merchantResult = await getMerchantOrError(userId);
  if (merchantResult.statusCode) return merchantResult;

  const currentStep = Number(payload.currentStep);
  const formData = payload.formData;

  if (!Number.isInteger(currentStep) || currentStep < 1 || currentStep > 5) {
    return {
      statusCode: 400,
      success: false,
      message: 'currentStep must be between 1 and 5'
    };
  }

  if (!formData || typeof formData !== 'object') {
    return {
      statusCode: 400,
      success: false,
      message: 'formData is required'
    };
  }

  const editError = ensureEditableKyc(merchantResult.merchant);
  if (editError) return editError;

  const now = new Date();
  const kyc = await MerchantKyc.upsertForUser(userId, {
    status: 'not_started',
    draftData: formData,
    draftCurrentStep: currentStep,
    draftSavedAt: now
  });

  return {
    statusCode: 200,
    success: true,
    message: 'KYC draft saved successfully',
    data: {
      onboarding: serializeMerchantOnboarding(merchantResult.merchant, kyc),
      kyc: serializeKycRecord(kyc, merchantResult.merchant)
    }
  };
};

const submitMerchantKyc = async (userId, payload = {}) => {
  const merchantResult = await getMerchantOrError(userId);
  if (merchantResult.statusCode) return merchantResult;

  const formData = payload.formData;
  if (!formData || typeof formData !== 'object') {
    return {
      statusCode: 400,
      success: false,
      message: 'formData is required'
    };
  }

  const normalized = normalizeSubmittedFormData(formData);
  const validation = validateAllKycSteps(normalized);
  if (!validation.valid) {
    return {
      statusCode: 400,
      success: false,
      message: validation.message,
      data: { step: validation.step }
    };
  }

  const editError = ensureEditableKyc(merchantResult.merchant);
  if (editError) return editError;

  let storedFormData;
  try {
    storedFormData = await persistKycFiles(userId, normalized);
  } catch (error) {
    return {
      statusCode: 400,
      success: false,
      message: error.message
    };
  }

  const now = new Date();
  const kyc = await MerchantKyc.upsertForUser(userId, {
    status: 'submitted',
    formData: storedFormData,
    draftData: null,
    draftCurrentStep: null,
    draftSavedAt: null,
    submittedAt: now,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null
  });
  const updatedMerchant = await User.update(userId, { kycStatus: 'submitted' });

  return {
    statusCode: 200,
    success: true,
    message: 'KYC submitted for review',
    data: {
      onboarding: serializeMerchantOnboarding(updatedMerchant, kyc),
      kyc: serializeKycRecord(kyc, updatedMerchant)
    }
  };
};

const getSubmittedKycRequests = async () => {
  const records = await MerchantKyc.findSubmitted();

  return {
    statusCode: 200,
    success: true,
    data: {
      count: records.length,
      requests: records.map(serializeSubmittedKycRequest)
    }
  };
};

const getMerchantKycById = async (merchantId) => {
  const record = await MerchantKyc.findSubmittedByMerchantId(merchantId);

  if (!record) {
    return {
      statusCode: 404,
      success: false,
      message: 'Submitted KYC record not found for this merchant'
    };
  }

  return {
    statusCode: 200,
    success: true,
    data: {
      request: serializeSubmittedKycRequest(record),
      kyc: serializeKycRecord(record, record.merchant)
    }
  };
};

const approveMerchantKyc = async (merchantId, adminUserId) => {
  const merchant = await User.findMerchantById(merchantId);

  if (!merchant) {
    return { statusCode: 404, success: false, message: 'Merchant not found' };
  }

  const kyc = await MerchantKyc.findByUserId(merchantId);

  if (!kyc || merchant.kycStatus !== 'submitted') {
    return {
      statusCode: 400,
      success: false,
      message: 'Only submitted KYC requests can be approved'
    };
  }

  const updated = await MerchantKyc.update(kyc.id, {
    status: 'approved',
    approvedAt: new Date(),
    approvedBy: adminUserId,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null
  });
  const updatedMerchant = await User.update(merchantId, { kycStatus: 'verified' });

  return {
    statusCode: 200,
    success: true,
    message: 'KYC approved successfully',
    data: {
      kyc: serializeKycRecord(updated, updatedMerchant)
    }
  };
};

const rejectMerchantKyc = async (merchantId, adminUserId, reason) => {
  const merchant = await User.findMerchantById(merchantId);

  if (!merchant) {
    return { statusCode: 404, success: false, message: 'Merchant not found' };
  }

  const kyc = await MerchantKyc.findByUserId(merchantId);

  if (!kyc || merchant.kycStatus !== 'submitted') {
    return {
      statusCode: 400,
      success: false,
      message: 'Only submitted KYC requests can be rejected'
    };
  }

  const now = new Date();
  const updated = await MerchantKyc.update(kyc.id, {
    status: 'not_started',
    draftData: kyc.formData,
    draftCurrentStep: 1,
    draftSavedAt: now,
    rejectedAt: now,
    rejectedBy: adminUserId,
    rejectionReason: reason ? String(reason).trim().slice(0, 500) : null,
    formData: null,
    submittedAt: null
  });
  const updatedMerchant = await User.update(merchantId, { kycStatus: 'rejected' });

  return {
    statusCode: 200,
    success: true,
    message: 'KYC rejected successfully',
    data: {
      kyc: serializeKycRecord(updated, updatedMerchant)
    }
  };
};

const getKycDocument = async (user, storagePath) => {
  const file = await readStoredFile(storagePath);

  if (!file) {
    return { statusCode: 404, success: false, message: 'Document not found' };
  }

  if (user.role === 'merchant') {
    const prefix = `${user.id}/`;
    if (!String(storagePath).startsWith(prefix)) {
      return { statusCode: 403, success: false, message: 'Access denied' };
    }
  }

  return {
    statusCode: 200,
    success: true,
    data: file
  };
};

module.exports = {
  getMerchantKycStatus,
  saveMerchantKycDraft,
  submitMerchantKyc,
  getSubmittedKycRequests,
  getMerchantKycById,
  approveMerchantKyc,
  rejectMerchantKyc,
  getKycDocument
};
