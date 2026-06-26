import { getKycFileSizeError, isImageFile } from "./kycFileHelpers";

export const KYC_REGEX = {
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
  address: /^[A-Za-z0-9\s.,#/'-]{5,200}$/,
};

export const KYC_FIELD_LABELS = {
  fullName: "Full Name",
  dateOfBirth: "Date of Birth",
  gender: "Gender",
  nationality: "Nationality",
  address: "Residential Address",
  city: "City",
  state: "State",
  pinCode: "PIN Code",
  legalName: "Legal Business Name",
  businessType: "Business Type",
  gstin: "GSTIN",
  pan: "Business PAN",
  registeredAddress: "Registered Address",
  website: "Website",
  idType: "Document Type",
  idNumber: "ID Number",
  idFrontFile: "ID Document (Front)",
  idBackFile: "ID Document (Back)",
  signatureFile: "Signature",
  profilePhotoFile: "Profile Photo",
  accountHolder: "Account Holder Name",
  bankName: "Bank Name",
  ifsc: "IFSC Code",
  accountNumber: "Account Number",
  accountType: "Account Type",
  passbookFrontFile: "Bank Passbook",
  passbookBackFile: "Passbook (Back Page)",
  gstCertificate: "GST Certificate",
  incorporationCertificate: "Incorporation Certificate",
  cancelledCheque: "Cancelled Cheque",
  boardResolution: "Board Resolution",
};

export const KYC_ID_DOCUMENT_TYPES = [
  { value: "aadhaar", label: "Aadhaar" },
  { value: "pan", label: "PAN Card" },
  { value: "passport", label: "Passport" },
];

export const KYC_DOCUMENT_TYPE_CONFIG = {
  aadhaar: {
    label: "Aadhaar",
    frontLabel: "Aadhaar Card (Front)",
    backLabel: "Aadhaar Card (Back Page)",
    showBack: true,
  },
  pan: {
    label: "PAN Card",
    frontLabel: "PAN Card",
    backLabel: null,
    showBack: false,
  },
  passport: {
    label: "Passport",
    frontLabel: "Passport (Front Page)",
    backLabel: "Passport (Back Page)",
    showBack: true,
  },
};

export const KYC_UPLOAD_DOCUMENT_TYPES = [
  { value: "gst_certificate", label: "GST Certificate" },
  { value: "profile_photo", label: "Profile Photo" },
  { value: "signature", label: "Signature" },
];

export const KYC_REQUIRED_UPLOAD_TYPES = [
  "gst_certificate",
  "profile_photo",
  "signature",
];

export const KYC_DEFAULT_UPLOAD_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
export const KYC_IMAGE_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif";

export const DEFAULT_FLEXIBLE_DOCUMENTS = [
  { id: "doc-gst", documentType: "gst_certificate", file: null },
  { id: "doc-profile", documentType: "profile_photo", file: null },
  { id: "doc-signature", documentType: "signature", file: null },
];

export function getDocumentTypeConfig(idType) {
  return KYC_DOCUMENT_TYPE_CONFIG[idType] || KYC_DOCUMENT_TYPE_CONFIG.aadhaar;
}

export function getUploadDocumentLabel(documentType) {
  const match = KYC_UPLOAD_DOCUMENT_TYPES.find((item) => item.value === documentType);
  return match?.label || documentType;
}

export function getUploadAccept(documentType) {
  return documentType === "profile_photo" ? KYC_IMAGE_UPLOAD_ACCEPT : KYC_DEFAULT_UPLOAD_ACCEPT;
}

export function getUploadPlaceholder(documentType) {
  return documentType === "profile_photo"
    ? "Choose image (JPG, PNG, WEBP)"
    : "Choose file (PDF, JPG, PNG)";
}

export function getUploadHint(documentType) {
  if (documentType === "profile_photo") {
    return "Image only (JPG, PNG, WEBP) · Max 5 MB";
  }
  return "PDF or image (JPG, PNG) · Max 5 MB";
}

export function getDefaultDocumentUploadHint() {
  return "Accepted: PDF, JPG, PNG · Max 5 MB per file";
}

export function isImageOnlyUploadType(documentType) {
  return documentType === "profile_photo";
}

export function isRequiredUploadType(documentType) {
  return KYC_REQUIRED_UPLOAD_TYPES.includes(documentType);
}

export function migrateFlexibleDocuments(incoming) {
  const existing = incoming?.flexibleDocuments;
  const findInExisting = (type) =>
    existing?.find((entry) => entry.documentType === type)?.file ?? null;

  const identityDocs = incoming?.identityDocs;
  const businessDocs = incoming?.businessDocs;

  const fileByType = {
    gst_certificate:
      findInExisting("gst_certificate") ?? businessDocs?.gstCertificate ?? null,
    profile_photo:
      findInExisting("profile_photo") ?? identityDocs?.profilePhotoFile ?? null,
    signature: findInExisting("signature") ?? identityDocs?.signatureFile ?? null,
  };

  return DEFAULT_FLEXIBLE_DOCUMENTS.map((item) => ({
    ...item,
    file: fileByType[item.documentType] ?? null,
  }));
}

export function migrateBankData(baseBank, incoming) {
  const bank = { ...baseBank, ...(incoming?.bank || {}) };
  const passbookFromFlexible = incoming?.flexibleDocuments?.find(
    (entry) => entry.documentType === "passbook_front",
  )?.file;

  if (!bank.passbookFrontFile && passbookFromFlexible) {
    bank.passbookFrontFile = passbookFromFlexible;
  }

  return bank;
}

function validateIdNumber(idType, idNumber) {
  const normalized = String(idNumber || "").trim();
  if (!normalized) {
    return "ID number is required.";
  }

  if (idType === "aadhaar" && !KYC_REGEX.aadhaar.test(normalized)) {
    return "Aadhaar must be a 12-digit number.";
  }

  if (idType === "pan" && !KYC_REGEX.pan.test(normalized.toUpperCase())) {
    return "PAN must match format ABCDE1234F.";
  }

  if (idType === "passport" && !KYC_REGEX.passport.test(normalized.toUpperCase())) {
    return "Passport must match format A1234567.";
  }

  return "";
}

export function hasFileValue(value) {
  if (!value) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return Boolean(value.name);
}

export function validateKycStep(step, formData) {
  switch (step) {
    case 1: {
      const { fullName, dateOfBirth, gender, nationality, address, city, state, pinCode } =
        formData.personal;

      if (!fullName?.trim()) return "Full Name is required.";
      if (!KYC_REGEX.fullName.test(fullName.trim())) {
        return "Full Name must contain only letters and be at least 2 characters.";
      }
      if (!dateOfBirth) return "Date of Birth is required.";
      if (!gender) return "Gender is required.";
      if (!nationality?.trim()) return "Nationality is required.";
      if (!address?.trim()) return "Residential Address is required.";
      if (!KYC_REGEX.address.test(address.trim())) {
        return "Enter a valid residential address (min 5 characters).";
      }
      if (!city?.trim()) return "City is required.";
      if (!KYC_REGEX.city.test(city.trim())) return "City must contain only letters.";
      if (!state?.trim()) return "State is required.";
      if (!KYC_REGEX.state.test(state.trim())) return "State must contain only letters.";
      if (!pinCode?.trim()) return "PIN Code is required.";
      if (!KYC_REGEX.pinCode.test(pinCode.trim())) return "PIN Code must be exactly 6 digits.";

      const { idType, idNumber } = formData.identityDocs;
      if (!idType) return "Document Type is required.";
      const idError = validateIdNumber(idType, idNumber);
      if (idError) return idError;
      break;
    }
    case 2: {
      const { legalName, businessType, gstin, pan, registeredAddress, website } = formData.business;

      if (!legalName?.trim()) return "Legal Business Name is required.";
      if (!KYC_REGEX.fullName.test(legalName.trim())) {
        return "Legal Business Name must contain only letters.";
      }
      if (!businessType) return "Business Type is required.";
      if (!gstin?.trim()) return "GSTIN is required.";
      if (!KYC_REGEX.gstin.test(gstin.trim().toUpperCase())) {
        return "GSTIN must match format 22AAAAA0000A1Z5.";
      }
      if (pan?.trim() && !KYC_REGEX.pan.test(pan.trim().toUpperCase())) {
        return "PAN must match format ABCDE1234F.";
      }
      if (!registeredAddress?.trim()) return "Registered Address is required.";
      if (!KYC_REGEX.address.test(registeredAddress.trim())) {
        return "Enter a valid registered address.";
      }
      if (website?.trim() && !KYC_REGEX.website.test(website.trim())) {
        return "Website must start with http:// or https://";
      }
      break;
    }
    case 3: {
      const { idType, idFrontFile, idBackFile } = formData.identityDocs;
      const docConfig = getDocumentTypeConfig(idType);
      const flexibleDocuments = formData.flexibleDocuments || [];

      if (!hasFileValue(idFrontFile)) return `${docConfig.frontLabel} is required.`;

      const uploadChecks = [
        { file: idFrontFile, label: docConfig.frontLabel },
        ...(docConfig.showBack && hasFileValue(idBackFile)
          ? [{ file: idBackFile, label: docConfig.backLabel }]
          : []),
      ];

      for (const requiredType of KYC_REQUIRED_UPLOAD_TYPES) {
        const entry = flexibleDocuments.find((item) => item.documentType === requiredType);
        if (!entry || !hasFileValue(entry.file)) {
          return `${getUploadDocumentLabel(requiredType)} is required.`;
        }
        if (isImageOnlyUploadType(requiredType) && !isImageFile(entry.file)) {
          return `${getUploadDocumentLabel(requiredType)} must be an image file (JPG, PNG, WEBP).`;
        }
        uploadChecks.push({
          file: entry.file,
          label: getUploadDocumentLabel(requiredType),
        });
      }

      for (const { file, label } of uploadChecks) {
        const sizeError = getKycFileSizeError(file, label);
        if (sizeError) {
          return sizeError;
        }
      }
      break;
    }
    case 4: {
      const { accountHolder, bankName, ifsc, accountNumber, passbookFrontFile } = formData.bank;

      if (!accountHolder?.trim()) return "Account Holder Name is required.";
      if (!KYC_REGEX.fullName.test(accountHolder.trim())) {
        return "Account Holder Name must contain only letters.";
      }
      if (!bankName?.trim()) return "Bank Name is required.";
      if (!ifsc?.trim()) return "IFSC Code is required.";
      if (!KYC_REGEX.ifsc.test(ifsc.trim().toUpperCase())) {
        return "IFSC must match format ABCD0123456.";
      }
      if (!accountNumber?.trim()) return "Account Number is required.";
      if (!KYC_REGEX.accountNumber.test(accountNumber.trim())) {
        return "Account Number must be 9 to 18 digits.";
      }
      if (!hasFileValue(passbookFrontFile)) return "Bank Passbook is required.";
      const passbookSizeError = getKycFileSizeError(passbookFrontFile, "Bank Passbook");
      if (passbookSizeError) {
        return passbookSizeError;
      }
      break;
    }
    case 5:
      break;
    default:
      break;
  }

  return "";
}

export function validateAllKycSteps(formData) {
  for (let step = 1; step <= 4; step += 1) {
    const error = validateKycStep(step, formData);
    if (error) {
      return { valid: false, step, message: error };
    }
  }
  return { valid: true };
}
