const KYC_REGEX = {
  fullName: /^[A-Za-z][A-Za-z\s.'-]{1,79}$/,
  pinCode: /^\d{6}$/,
  city: /^[A-Za-z\s.'-]{2,60}$/,
  state: /^[A-Za-z\s.'-]{2,60}$/,
  gstin: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  aadhaar: /^\d{12}$/,
  passport: /^[A-Z][0-9]{7}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  accountNumber: /^\d{9,18}$/,
  website: /^https?:\/\/[\w.-]+\.[A-Za-z]{2,}(\/.*)?$/i,
  address: /^[A-Za-z0-9\s.,#/'-]{5,200}$/
};

const KYC_DOCUMENT_TYPE_CONFIG = {
  aadhaar: { frontLabel: 'Aadhaar Card (Front)', showBack: true },
  pan: { frontLabel: 'PAN Card', showBack: false },
  passport: { frontLabel: 'Passport (Front Page)', showBack: true }
};

const KYC_UPLOAD_DOCUMENT_TYPES = {
  gst_certificate: 'GST Certificate',
  profile_photo: 'Profile Photo',
  signature: 'Signature'
};

const KYC_REQUIRED_UPLOAD_TYPES = ['gst_certificate', 'profile_photo', 'signature'];

const hasFileValue = (value) => {
  if (!value) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return Boolean(value.name || value.storagePath || value.dataUrl);
};

const getDocumentTypeConfig = (idType) =>
  KYC_DOCUMENT_TYPE_CONFIG[idType] || KYC_DOCUMENT_TYPE_CONFIG.aadhaar;

const getUploadDocumentLabel = (documentType) =>
  KYC_UPLOAD_DOCUMENT_TYPES[documentType] || documentType;

const validateIdNumber = (idType, idNumber) => {
  const normalized = String(idNumber || '').trim();
  if (!normalized) return 'ID number is required.';

  if (idType === 'aadhaar' && !KYC_REGEX.aadhaar.test(normalized)) {
    return 'Aadhaar must be a 12-digit number.';
  }

  if (idType === 'pan' && !KYC_REGEX.pan.test(normalized.toUpperCase())) {
    return 'PAN must match format ABCDE1234F.';
  }

  if (idType === 'passport' && !KYC_REGEX.passport.test(normalized.toUpperCase())) {
    return 'Passport must match format A1234567.';
  }

  return '';
};

const validateKycStep = (step, formData = {}) => {
  switch (step) {
    case 1: {
      const { fullName, dateOfBirth, gender, nationality, address, city, state, pinCode } =
        formData.personal || {};
      const { idType, idNumber } = formData.identityDocs || {};

      if (!fullName?.trim()) return 'Full Name is required.';
      if (!KYC_REGEX.fullName.test(fullName.trim())) {
        return 'Full Name must contain only letters and be at least 2 characters.';
      }
      if (!dateOfBirth) return 'Date of Birth is required.';
      if (!gender) return 'Gender is required.';
      if (!nationality?.trim()) return 'Nationality is required.';
      if (!address?.trim()) return 'Residential Address is required.';
      if (!KYC_REGEX.address.test(address.trim())) {
        return 'Enter a valid residential address (min 5 characters).';
      }
      if (!city?.trim()) return 'City is required.';
      if (!KYC_REGEX.city.test(city.trim())) return 'City must contain only letters.';
      if (!state?.trim()) return 'State is required.';
      if (!KYC_REGEX.state.test(state.trim())) return 'State must contain only letters.';
      if (!pinCode?.trim()) return 'PIN Code is required.';
      if (!KYC_REGEX.pinCode.test(pinCode.trim())) return 'PIN Code must be exactly 6 digits.';
      if (!idType) return 'Document Type is required.';
      return validateIdNumber(idType, idNumber);
    }
    case 2: {
      const { legalName, businessType, gstin, pan, registeredAddress, website } =
        formData.business || {};

      if (!legalName?.trim()) return 'Legal Business Name is required.';
      if (!KYC_REGEX.fullName.test(legalName.trim())) {
        return 'Legal Business Name must contain only letters.';
      }
      if (!businessType) return 'Business Type is required.';
      if (!gstin?.trim()) return 'GSTIN is required.';
      if (!KYC_REGEX.gstin.test(gstin.trim().toUpperCase())) {
        return 'GSTIN must match format 22AAAAA0000A1Z5.';
      }
      if (pan?.trim() && !KYC_REGEX.pan.test(pan.trim().toUpperCase())) {
        return 'PAN must match format ABCDE1234F.';
      }
      if (!registeredAddress?.trim()) return 'Registered Address is required.';
      if (!KYC_REGEX.address.test(registeredAddress.trim())) {
        return 'Enter a valid registered address.';
      }
      if (website?.trim() && !KYC_REGEX.website.test(website.trim())) {
        return 'Website must start with http:// or https://';
      }
      return '';
    }
    case 3: {
      const { idType, idFrontFile } = formData.identityDocs || {};
      const docConfig = getDocumentTypeConfig(idType);
      const flexibleDocuments = formData.flexibleDocuments || [];

      if (!hasFileValue(idFrontFile)) return `${docConfig.frontLabel} is required.`;

      for (const requiredType of KYC_REQUIRED_UPLOAD_TYPES) {
        const uploaded = flexibleDocuments.find(
          (entry) => entry.documentType === requiredType && hasFileValue(entry.file)
        );
        if (!uploaded) {
          return `${getUploadDocumentLabel(requiredType)} is required.`;
        }
      }
      return '';
    }
    case 4: {
      const { accountHolder, bankName, ifsc, accountNumber, passbookFrontFile } =
        formData.bank || {};

      if (!accountHolder?.trim()) return 'Account Holder Name is required.';
      if (!KYC_REGEX.fullName.test(accountHolder.trim())) {
        return 'Account Holder Name must contain only letters.';
      }
      if (!bankName?.trim()) return 'Bank Name is required.';
      if (!ifsc?.trim()) return 'IFSC Code is required.';
      if (!KYC_REGEX.ifsc.test(ifsc.trim().toUpperCase())) {
        return 'IFSC must match format ABCD0123456.';
      }
      if (!accountNumber?.trim()) return 'Account Number is required.';
      if (!KYC_REGEX.accountNumber.test(accountNumber.trim())) {
        return 'Account Number must be 9 to 18 digits.';
      }
      if (!hasFileValue(passbookFrontFile)) return 'Bank Passbook is required.';
      return '';
    }
    default:
      return '';
  }
};

const validateAllKycSteps = (formData) => {
  for (let step = 1; step <= 4; step += 1) {
    const message = validateKycStep(step, formData);
    if (message) {
      return { valid: false, step, message };
    }
  }

  return { valid: true };
};

const normalizeSubmittedFormData = (formData = {}) => {
  const personal = formData.personal || {};
  const business = formData.business || {};
  const identityDocs = formData.identityDocs || {};
  const bank = formData.bank || {};

  return {
    personal: {
      ...personal,
      fullName: String(personal.fullName || '').trim(),
      nationality: String(personal.nationality || '').trim(),
      address: String(personal.address || '').trim(),
      city: String(personal.city || '').trim(),
      state: String(personal.state || '').trim(),
      pinCode: String(personal.pinCode || '').trim()
    },
    business: {
      ...business,
      legalName: String(business.legalName || '').trim(),
      gstin: String(business.gstin || '').trim().toUpperCase(),
      pan: business.pan ? String(business.pan).trim().toUpperCase() : '',
      registeredAddress: String(business.registeredAddress || '').trim(),
      website: business.website ? String(business.website).trim() : ''
    },
    identityDocs: {
      ...identityDocs,
      idType: identityDocs.idType || 'aadhaar',
      idNumber:
        identityDocs.idType === 'aadhaar'
          ? String(identityDocs.idNumber || '').trim()
          : String(identityDocs.idNumber || '').trim().toUpperCase()
    },
    flexibleDocuments: Array.isArray(formData.flexibleDocuments) ? formData.flexibleDocuments : [],
    bank: {
      ...bank,
      accountHolder: String(bank.accountHolder || '').trim(),
      bankName: String(bank.bankName || '').trim(),
      ifsc: String(bank.ifsc || '').trim().toUpperCase(),
      accountNumber: String(bank.accountNumber || '').trim(),
      accountType: bank.accountType || 'current'
    }
  };
};

module.exports = {
  KYC_REGEX,
  hasFileValue,
  validateKycStep,
  validateAllKycSteps,
  normalizeSubmittedFormData
};
