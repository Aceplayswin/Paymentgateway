import { useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiEye,
  FiSave,
  FiShield,
} from "react-icons/fi";
import { Navigate, useNavigate } from "react-router-dom";
import KycFieldLabel from "../../components/kyc/KycFieldLabel";
import KycDocumentTypeSelect from "../../components/kyc/KycDocumentTypeSelect";
import OnboardingShell from "../../components/onboarding/OnboardingShell";
import KycFileUploadZone from "../../components/kyc/KycFileUploadZone";
import KycReviewSummary from "../../components/kyc/KycReviewSummary";
import KycStepIndicator from "../../components/KycStepIndicator";
import {
  getUserDisplayName,
  getUserEmail,
  getUserRole,
  isAuthenticated,
} from "../../utils/authStorage";
import { prepareKycDataForSubmit, stripPreviewFromDraft } from "../../utils/kycFileHelpers";
import {
  validateAllKycSteps,
  validateKycStep,
  getDocumentTypeConfig,
  DEFAULT_FLEXIBLE_DOCUMENTS,
  migrateFlexibleDocuments,
  migrateBankData,
  getDefaultDocumentUploadHint,
  getUploadAccept,
  getUploadDocumentLabel,
  getUploadHint,
  getUploadPlaceholder,
} from "../../utils/kycValidation";
import {
  ACCOUNT_STATUS,
  getKycDraft,
  getMerchantOnboarding,
  KYC_STATUS,
  saveKycDraft,
  syncMerchantOnboardingFromApiRecord,
} from "../../utils/onboardingStorage";
import { submitKyc } from "../../services/kyc";
import { showServerSuccessToast } from "../../utils/toast";

const TOTAL_STEPS = 5;

const INITIAL_FORM = {
  personal: {
    fullName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "Indian",
    address: "",
    city: "",
    state: "",
    pinCode: "",
  },
  business: {
    legalName: "",
    businessType: "",
    gstin: "",
    pan: "",
    registeredAddress: "",
    website: "",
  },
  identityDocs: {
    idType: "aadhaar",
    idNumber: "",
    idFrontFile: null,
    idBackFile: null,
  },
  flexibleDocuments: DEFAULT_FLEXIBLE_DOCUMENTS.map((item) => ({ ...item })),
  bank: {
    accountHolder: "",
    bankName: "",
    ifsc: "",
    accountNumber: "",
    accountType: "current",
    passbookFrontFile: null,
  },
};

function mergeFormData(base, incoming) {
  if (!incoming) {
    return base;
  }

  return {
    personal: { ...base.personal, ...incoming.personal },
    business: { ...base.business, ...incoming.business },
    identityDocs: { ...base.identityDocs, ...incoming.identityDocs },
    flexibleDocuments: migrateFlexibleDocuments(incoming),
    bank: migrateBankData(base.bank, incoming),
  };
}

function migrateDraftStep(step) {
  if (!step || step <= 2) {
    return step;
  }
  if (step >= 5) {
    return 5;
  }
  if (step === 3) {
    return 4;
  }
  if (step === 4) {
    return 3;
  }
  return step;
}

function buildInitialState(record) {
  const base = mergeFormData(INITIAL_FORM, {
    personal: { fullName: getUserDisplayName() },
    business: { legalName: record?.kycData?.business?.legalName || "" },
    bank: { accountHolder: getUserDisplayName() },
  });

  const draft = getKycDraft(record?.email);
  if (draft?.formData) {
    const merged = mergeFormData(base, draft.formData);
    return {
      formData: merged,
      currentStep: Math.min(Math.max(migrateDraftStep(draft.currentStep) || 1, 1), TOTAL_STEPS),
      draftSavedAt: draft.savedAt || null,
    };
  }

  return { formData: base, currentStep: 1, draftSavedAt: null };
}

function formatDraftTime(value) {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString();
}

function KycVerificationPage() {
  const navigate = useNavigate();
  const email = getUserEmail();
  const record = getMerchantOnboarding(email);
  const initialState = useMemo(() => buildInitialState(record), [email, record]);

  const [currentStep, setCurrentStep] = useState(initialState.currentStep);
  const [formData, setFormData] = useState(initialState.formData);
  const [draftSavedAt, setDraftSavedAt] = useState(initialState.draftSavedAt);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (getUserRole() !== "merchant") {
    return <Navigate to="/dashboard/admin" replace />;
  }

  if (
    !record ||
    record.accountStatus !== ACCOUNT_STATUS.APPROVED ||
    record.kycStatus !== KYC_STATUS.NOT_STARTED
  ) {
    return <Navigate to="/dashboard/merchant" replace />;
  }

  const updateSection = (section, field, value) => {
    setFormData((previous) => ({
      ...previous,
      [section]: { ...previous[section], [field]: value },
    }));
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleDocumentTypeChange = (value) => {
    setFormData((previous) => ({
      ...previous,
      identityDocs: {
        ...previous.identityDocs,
        idType: value,
        idFrontFile: null,
        idBackFile: null,
      },
    }));
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const updateFlexibleDocument = (index, updates) => {
    setFormData((previous) => ({
      ...previous,
      flexibleDocuments: previous.flexibleDocuments.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...updates } : entry,
      ),
    }));
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const documentTypeConfig = getDocumentTypeConfig(formData.identityDocs.idType);

  const persistDraft = async (step = currentStep, showToast = false) => {
    setIsSavingDraft(true);
    const payload = stripPreviewFromDraft(formData);
    const updated = saveKycDraft(email, { currentStep: step, formData: payload });
    const savedAt = updated?.kycDraft?.savedAt || new Date().toISOString();
    setDraftSavedAt(savedAt);
    setIsSavingDraft(false);
    if (showToast) {
      showServerSuccessToast("KYC draft saved successfully.");
    }
    return savedAt;
  };

  const handleSaveDraft = async () => {
    await persistDraft(currentStep, true);
  };

  const handleNext = async () => {
    const error = validateKycStep(currentStep, formData);
    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage("");
    await persistDraft(currentStep);
    const nextStep = Math.min(currentStep + 1, TOTAL_STEPS);
    if (nextStep === TOTAL_STEPS) {
      setDetailsConfirmed(false);
    }
    setCurrentStep(nextStep);
  };

  const handleBack = async () => {
    setErrorMessage("");
    const nextStep = Math.max(currentStep - 1, 1);
    if (currentStep === TOTAL_STEPS) {
      setDetailsConfirmed(false);
    }
    await persistDraft(nextStep);
    setCurrentStep(nextStep);
  };

  const handleEditStep = async (step) => {
    setErrorMessage("");
    setDetailsConfirmed(false);
    await persistDraft(step);
    setCurrentStep(step);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!detailsConfirmed) {
      setErrorMessage("Please verify your details and confirm the checkbox before submitting.");
      return;
    }

    const validation = validateAllKycSteps(formData);
    if (!validation.valid) {
      setErrorMessage(validation.message);
      setCurrentStep(validation.step);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const response = await submitKyc({
        formData: prepareKycDataForSubmit(formData),
      });
      const onboarding = response?.data?.onboarding;
      if (onboarding) {
        syncMerchantOnboardingFromApiRecord(onboarding);
      }
      showServerSuccessToast("KYC submitted for review.");
      navigate("/kyc-under-review", { replace: true });
    } catch (error) {
      setErrorMessage(error?.data?.message || "Unable to submit KYC right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    "Personal Information",
    "Business Information",
    "Documents Upload",
    "Bank Account Details",
    "Verify Your Details",
  ];

  return (
    <OnboardingShell>
      <section className="kyc-page" aria-label="KYC verification">
        <header className="kyc-page-header">
          <div className="kyc-page-header__icon" aria-hidden="true">
            <FiShield />
          </div>
          <span className="auth-brand">KYC VERIFICATION</span>
          <h1>Merchant Verification</h1>
          <p className="auth-subtitle">
            Complete all sections to activate your payment gateway account. Fields marked with{" "}
            <span className="kyc-required">*</span> are mandatory. Your progress is saved as draft
            automatically when you move between steps.
          </p>
          {draftSavedAt ? (
            <p className="kyc-draft-status">Draft last saved: {formatDraftTime(draftSavedAt)}</p>
          ) : null}
        </header>

        <KycStepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        <form className="kyc-wizard" onSubmit={handleSubmit}>
          <div className="kyc-section-card">
            <div className="kyc-section-card__head">
              <span className="kyc-section-card__step-pill">Step {currentStep}</span>
              <h2>{stepTitles[currentStep - 1]}</h2>
            </div>
            <div className="kyc-section-card__body">
            {currentStep === 1 && (
              <div className="field-grid">
                <div>
                  <KycFieldLabel htmlFor="fullName" required>
                    Full Name
                  </KycFieldLabel>
                  <input
                    id="fullName"
                    className="field-input"
                    value={formData.personal.fullName}
                    onChange={(event) => updateSection("personal", "fullName", event.target.value)}
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="dateOfBirth" required>
                    Date of Birth
                  </KycFieldLabel>
                  <input
                    id="dateOfBirth"
                    type="date"
                    className="field-input"
                    value={formData.personal.dateOfBirth}
                    onChange={(event) => updateSection("personal", "dateOfBirth", event.target.value)}
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="gender" required>
                    Gender
                  </KycFieldLabel>
                  <select
                    id="gender"
                    className="field-input"
                    value={formData.personal.gender}
                    onChange={(event) => updateSection("personal", "gender", event.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <KycFieldLabel htmlFor="nationality" required>
                    Nationality
                  </KycFieldLabel>
                  <input
                    id="nationality"
                    className="field-input"
                    value={formData.personal.nationality}
                    onChange={(event) => updateSection("personal", "nationality", event.target.value)}
                  />
                </div>
                <div className="field-full">
                  <KycFieldLabel htmlFor="address" required>
                    Residential Address
                  </KycFieldLabel>
                  <input
                    id="address"
                    className="field-input"
                    value={formData.personal.address}
                    onChange={(event) => updateSection("personal", "address", event.target.value)}
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="city" required>
                    City
                  </KycFieldLabel>
                  <input
                    id="city"
                    className="field-input"
                    value={formData.personal.city}
                    onChange={(event) => updateSection("personal", "city", event.target.value)}
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="state" required>
                    State
                  </KycFieldLabel>
                  <input
                    id="state"
                    className="field-input"
                    value={formData.personal.state}
                    onChange={(event) => updateSection("personal", "state", event.target.value)}
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="pinCode" required>
                    PIN Code
                  </KycFieldLabel>
                  <input
                    id="pinCode"
                    className="field-input"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.personal.pinCode}
                    onChange={(event) => updateSection("personal", "pinCode", event.target.value)}
                  />
                </div>
                <div className="field-full kyc-section-divider">
                  <h3 className="kyc-subsection-title">Identity Verification</h3>
                </div>
                <div>
                  <KycDocumentTypeSelect
                    id="idType"
                    value={formData.identityDocs.idType}
                    onChange={handleDocumentTypeChange}
                    required
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="idNumber" required>
                    ID Number
                  </KycFieldLabel>
                  <input
                    id="idNumber"
                    className="field-input"
                    value={formData.identityDocs.idNumber}
                    onChange={(event) => updateSection("identityDocs", "idNumber", event.target.value)}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="field-grid">
                <div>
                  <KycFieldLabel htmlFor="legalName" required>
                    Legal Business Name
                  </KycFieldLabel>
                  <input
                    id="legalName"
                    className="field-input"
                    value={formData.business.legalName}
                    onChange={(event) => updateSection("business", "legalName", event.target.value)}
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="businessType" required>
                    Business Type
                  </KycFieldLabel>
                  <select
                    id="businessType"
                    className="field-input"
                    value={formData.business.businessType}
                    onChange={(event) => updateSection("business", "businessType", event.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Retail">Retail</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Services">Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <KycFieldLabel htmlFor="gstin" required>
                    GSTIN
                  </KycFieldLabel>
                  <input
                    id="gstin"
                    className="field-input"
                    value={formData.business.gstin}
                    onChange={(event) =>
                      updateSection("business", "gstin", event.target.value.toUpperCase())
                    }
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="pan">Business PAN (optional)</KycFieldLabel>
                  <input
                    id="pan"
                    className="field-input"
                    value={formData.business.pan}
                    onChange={(event) => updateSection("business", "pan", event.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div className="field-full">
                  <KycFieldLabel htmlFor="registeredAddress" required>
                    Registered Address
                  </KycFieldLabel>
                  <input
                    id="registeredAddress"
                    className="field-input"
                    value={formData.business.registeredAddress}
                    onChange={(event) =>
                      updateSection("business", "registeredAddress", event.target.value)
                    }
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="website">Website (optional)</KycFieldLabel>
                  <input
                    id="website"
                    type="url"
                    className="field-input"
                    placeholder="https://"
                    value={formData.business.website}
                    onChange={(event) => updateSection("business", "website", event.target.value)}
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="field-stack">
                <div className="kyc-section-divider">
                  <h3 className="kyc-subsection-title">Identity Document</h3>
                  <p className="kyc-subsection-hint">{getDefaultDocumentUploadHint()}</p>
                </div>
                <div>
                  <KycDocumentTypeSelect
                    id="uploadIdType"
                    value={formData.identityDocs.idType}
                    onChange={handleDocumentTypeChange}
                    required
                  />
                </div>
                <div>
                  <KycFileUploadZone
                    id="idFront"
                    label={documentTypeConfig.frontLabel}
                    required
                    value={formData.identityDocs.idFrontFile}
                    onChange={(value) => updateSection("identityDocs", "idFrontFile", value)}
                  />
                </div>
                {documentTypeConfig.showBack ? (
                  <div>
                    <KycFileUploadZone
                      id="idBack"
                      label={documentTypeConfig.backLabel}
                      value={formData.identityDocs.idBackFile}
                      onChange={(value) => updateSection("identityDocs", "idBackFile", value)}
                    />
                  </div>
                ) : null}

                <div className="kyc-section-divider">
                  <h3 className="kyc-subsection-title">Other Documents</h3>
                  <p className="kyc-subsection-hint">
                    Upload the required documents below. Fields marked with{" "}
                    <span className="kyc-required">*</span> are mandatory. {getDefaultDocumentUploadHint()}.
                  </p>
                </div>

                {formData.flexibleDocuments.map((entry, index) => (
                  <div key={entry.id}>
                    <KycFileUploadZone
                      id={entry.id}
                      label={getUploadDocumentLabel(entry.documentType)}
                      required
                      accept={getUploadAccept(entry.documentType)}
                      placeholder={getUploadPlaceholder(entry.documentType)}
                      hint={getUploadHint(entry.documentType)}
                      value={entry.file}
                      onChange={(value) => updateFlexibleDocument(index, { file: value })}
                    />
                  </div>
                ))}
              </div>
            )}

            {currentStep === 4 && (
              <div className="field-grid">
                <div>
                  <KycFieldLabel htmlFor="accountHolder" required>
                    Account Holder Name
                  </KycFieldLabel>
                  <input
                    id="accountHolder"
                    className="field-input"
                    value={formData.bank.accountHolder}
                    onChange={(event) => updateSection("bank", "accountHolder", event.target.value)}
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="bankName" required>
                    Bank Name
                  </KycFieldLabel>
                  <input
                    id="bankName"
                    className="field-input"
                    value={formData.bank.bankName}
                    onChange={(event) => updateSection("bank", "bankName", event.target.value)}
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="ifsc" required>
                    IFSC Code
                  </KycFieldLabel>
                  <input
                    id="ifsc"
                    className="field-input"
                    value={formData.bank.ifsc}
                    onChange={(event) =>
                      updateSection("bank", "ifsc", event.target.value.toUpperCase())
                    }
                    placeholder="ABCD0123456"
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="accountNumber" required>
                    Account Number
                  </KycFieldLabel>
                  <input
                    id="accountNumber"
                    className="field-input"
                    inputMode="numeric"
                    value={formData.bank.accountNumber}
                    onChange={(event) => updateSection("bank", "accountNumber", event.target.value)}
                  />
                </div>
                <div>
                  <KycFieldLabel htmlFor="accountType" required>
                    Account Type
                  </KycFieldLabel>
                  <select
                    id="accountType"
                    className="field-input"
                    value={formData.bank.accountType}
                    onChange={(event) => updateSection("bank", "accountType", event.target.value)}
                  >
                    <option value="current">Current</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
                <div className="field-full">
                  <KycFileUploadZone
                    id="passbookFront"
                    label="Bank Passbook"
                    required
                    hint={getDefaultDocumentUploadHint()}
                    value={formData.bank.passbookFrontFile}
                    onChange={(value) => updateSection("bank", "passbookFrontFile", value)}
                  />
                </div>

                <div className="kyc-verify-prompt field-full">
                  <div className="kyc-verify-prompt__icon" aria-hidden="true">
                    <FiEye />
                  </div>
                  <div>
                    <h3>Ready to verify?</h3>
                    <p>
                      Click <strong>Verify Details</strong> below to review everything you entered,
                      preview documents, and save or print your verification summary before
                      submission.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <KycReviewSummary
                formData={formData}
                email={email}
                onEditStep={handleEditStep}
                detailsConfirmed={detailsConfirmed}
                onDetailsConfirmedChange={setDetailsConfirmed}
                showToolbar={false}
                bannerDescription="Please review every field and uploaded document below, then confirm and submit when everything is correct."
              />
            )}
            </div>
          </div>

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <div className="kyc-action-bar">
            <div className="kyc-action-bar__left">
              {currentStep > 1 ? (
                <button
                  type="button"
                  className="kyc-btn kyc-btn--ghost"
                  onClick={handleBack}
                  disabled={isSubmitting || isSavingDraft}
                >
                  <FiArrowLeft aria-hidden="true" />
                  Previous
                </button>
              ) : null}
            </div>

            <div className="kyc-action-bar__right">
              <button
                type="button"
                className="kyc-btn kyc-btn--draft"
                onClick={handleSaveDraft}
                disabled={isSubmitting || isSavingDraft}
              >
                <FiSave aria-hidden="true" />
                {isSavingDraft ? "Saving Draft..." : "Save Draft"}
              </button>

              {currentStep === TOTAL_STEPS ? (
                <button
                  type="submit"
                  className="kyc-btn kyc-btn--submit"
                  disabled={isSubmitting || isSavingDraft || !detailsConfirmed}
                  title={detailsConfirmed ? "" : "Confirm verification checkbox to submit"}
                >
                  <FiCheck aria-hidden="true" />
                  {isSubmitting ? "Submitting..." : "Submit KYC"}
                </button>
              ) : currentStep === TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  className="kyc-btn kyc-btn--next"
                  onClick={handleNext}
                  disabled={isSavingDraft}
                >
                  <FiEye aria-hidden="true" />
                  Verify Details
                </button>
              ) : (
                <button
                  type="button"
                  className="kyc-btn kyc-btn--next"
                  onClick={handleNext}
                  disabled={isSavingDraft}
                >
                  Continue
                  <FiArrowRight aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </form>
      </section>
    </OnboardingShell>
  );
}

export default KycVerificationPage;
