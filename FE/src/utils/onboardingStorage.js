import { getKycStatus } from "../services/kyc";
import { getUserEmail, getUserRole } from "./authStorage";
import {
  clearDismissedNotification,
  NOTIFICATION_TYPES,
  notifyAdminKycSubmitted,
} from "./notificationStorage";

export const ONBOARDING_CHANGED_EVENT = "paygate-onboarding-changed";

const ONBOARDING_KEY = "paygate_merchant_onboarding";

export const ACCOUNT_STATUS = {
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
};

export const KYC_STATUS = {
  NOT_STARTED: "not_started",
  SUBMITTED: "submitted",
  APPROVED: "approved",
};

function readStore() {
  const raw = localStorage.getItem(ONBOARDING_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeStore(store) {
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(ONBOARDING_CHANGED_EVENT));
}

function onboardingRecordsEqual(a, b) {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function initMerchantOnboarding(user) {
  const email = normalizeEmail(user.email);
  if (!email) {
    return null;
  }

  const store = readStore();
  const record = {
    userId: String(user.id),
    email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phoneNumber: user.phoneNumber || "",
    accountStatus: ACCOUNT_STATUS.PENDING_REVIEW,
    kycStatus: KYC_STATUS.NOT_STARTED,
    kycData: null,
    registeredAt: new Date().toISOString(),
    kycSubmittedAt: null,
  };

  store[email] = record;
  writeStore(store);
  return record;
}

export function getMerchantOnboarding(email = getUserEmail()) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }

  const store = readStore();
  return store[normalized] || null;
}

export function updateMerchantOnboarding(email, patch) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }

  const store = readStore();
  const existing = store[normalized];
  if (!existing) {
    return null;
  }

  const updated = { ...existing, ...patch };
  store[normalized] = updated;
  writeStore(store);
  return updated;
}

export function getAllMerchantOnboardingRecords() {
  const store = readStore();
  return Object.values(store).sort(
    (a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0)
  );
}

export function isMerchantFullyOnboarded(email = getUserEmail()) {
  const record = getMerchantOnboarding(email);
  if (!record) {
    return true;
  }

  return (
    record.accountStatus === ACCOUNT_STATUS.APPROVED &&
    record.kycStatus === KYC_STATUS.APPROVED
  );
}

export function canAccessDashboard(email = getUserEmail()) {
  if (getUserRole() === "admin") {
    return true;
  }
  return isMerchantFullyOnboarded(email);
}

export function shouldShowKycOverlayFromRecord(record) {
  if (!record) {
    return false;
  }

  return (
    record.accountStatus === ACCOUNT_STATUS.APPROVED &&
    record.kycStatus === KYC_STATUS.NOT_STARTED
  );
}

export function shouldShowKycOverlay(email = getUserEmail()) {
  if (getUserRole() !== "merchant") {
    return false;
  }

  return shouldShowKycOverlayFromRecord(getMerchantOnboarding(email));
}

export async function syncMerchantOnboardingFromKycApi() {
  if (getUserRole() !== "merchant") {
    return null;
  }

  try {
    const response = await getKycStatus();
    const onboarding = response?.data?.onboarding;
    if (onboarding) {
      return syncMerchantOnboardingFromApiRecord(onboarding);
    }
  } catch {
    return null;
  }

  return null;
}

export async function resolveKycOverlayVisibility() {
  if (getUserRole() !== "merchant") {
    return false;
  }

  const record = await syncMerchantOnboardingFromKycApi();
  if (record) {
    return shouldShowKycOverlayFromRecord(record);
  }

  syncMerchantOnboardingFromStoredAuth();
  return shouldShowKycOverlay();
}

function mapAccountStatusFromApi(accountStatus) {
  return accountStatus === ACCOUNT_STATUS.APPROVED
    ? ACCOUNT_STATUS.APPROVED
    : ACCOUNT_STATUS.PENDING_REVIEW;
}

export function syncMerchantOnboardingFromApiRecord(onboarding) {
  const email = normalizeEmail(onboarding?.email);
  if (!email) {
    return null;
  }

  const store = readStore();
  const existing = store[email];

  const record = {
    userId: String(onboarding.userId),
    email,
    firstName: onboarding.firstName || existing?.firstName || "",
    lastName: onboarding.lastName || existing?.lastName || "",
    phoneNumber: onboarding.phoneNumber || existing?.phoneNumber || "",
    accountStatus: mapAccountStatusFromApi(onboarding.accountStatus),
    kycStatus: onboarding.kycStatus || KYC_STATUS.NOT_STARTED,
    kycData: onboarding.kycData ?? existing?.kycData ?? null,
    kycDraft: onboarding.kycDraft ?? existing?.kycDraft ?? null,
    registeredAt: onboarding.registeredAt || existing?.registeredAt || new Date().toISOString(),
    kycSubmittedAt: onboarding.kycSubmittedAt ?? existing?.kycSubmittedAt ?? null,
    kycApprovedAt: onboarding.kycApprovedAt ?? existing?.kycApprovedAt ?? null,
    kycRejectionReason: onboarding.kycRejectionReason ?? existing?.kycRejectionReason ?? null,
    kycRejectedAt: onboarding.kycRejectedAt ?? existing?.kycRejectedAt ?? null,
  };

  store[email] = record;
  writeStore(store);
  return record;
}

export function syncMerchantOnboardingFromUser(user) {
  const email = normalizeEmail(user?.email);
  if (!email || user?.role === "admin") {
    return null;
  }

  const store = readStore();
  const existing = store[email];

  let accountStatus = ACCOUNT_STATUS.PENDING_REVIEW;
  if (user.approvalStatus === "approved" || user.accountStatus === ACCOUNT_STATUS.APPROVED) {
    accountStatus = ACCOUNT_STATUS.APPROVED;
  }

  const record = {
    userId: String(user.id),
    email,
    firstName: user.firstName || existing?.firstName || "",
    lastName: user.lastName || existing?.lastName || "",
    phoneNumber: user.phoneNumber || existing?.phoneNumber || "",
    accountStatus,
    kycStatus: user.kycStatus ?? existing?.kycStatus ?? KYC_STATUS.NOT_STARTED,
    kycData: existing?.kycData ?? null,
    kycDraft: existing?.kycDraft ?? null,
    registeredAt: existing?.registeredAt || user.createdAt || new Date().toISOString(),
    kycSubmittedAt: existing?.kycSubmittedAt ?? null,
  };

  if (onboardingRecordsEqual(existing, record)) {
    return record;
  }

  store[email] = record;
  writeStore(store);
  return record;
}

export function syncMerchantOnboardingFromStoredAuth() {
  if (getUserRole() !== "merchant") {
    return null;
  }

  const email = getUserEmail();
  if (!email) {
    return null;
  }

  const approvalStatus = localStorage.getItem("paygate_user_approval_status") || "pending";

  return syncMerchantOnboardingFromUser({
    id: localStorage.getItem("paygate_user_id"),
    email,
    role: "merchant",
    approvalStatus,
  });
}

export function getPostLoginPath(user) {
  const role = user.role === "admin" ? "admin" : "merchant";

  if (role === "admin") {
    return "/dashboard/admin";
  }

  const record = syncMerchantOnboardingFromUser(user);

  if (!record) {
    return "/dashboard/merchant";
  }

  if (record.accountStatus === ACCOUNT_STATUS.PENDING_REVIEW) {
    return "/application-under-review";
  }

  if (record.kycStatus === KYC_STATUS.SUBMITTED) {
    return "/kyc-under-review";
  }

  return "/dashboard/merchant";
}

export function getOnboardingRedirectPath(email = getUserEmail()) {
  if (getUserRole() === "admin") {
    return null;
  }

  const record = getMerchantOnboarding(email);

  if (!record) {
    return null;
  }

  if (record.accountStatus === ACCOUNT_STATUS.PENDING_REVIEW) {
    return "/application-under-review";
  }

  if (record.kycStatus === KYC_STATUS.SUBMITTED) {
    return "/kyc-under-review";
  }

  if (
    record.accountStatus === ACCOUNT_STATUS.APPROVED &&
    record.kycStatus === KYC_STATUS.NOT_STARTED
  ) {
    return null;
  }

  return null;
}

export function getKycStatusLabel(kycStatus) {
  switch (kycStatus) {
    case KYC_STATUS.NOT_STARTED:
      return "Pending";
    case KYC_STATUS.SUBMITTED:
      return "Under Review";
    case KYC_STATUS.APPROVED:
      return "Fully Verified";
    default:
      return "Fully Verified";
  }
}

export function approveMerchantAccount(email) {
  return updateMerchantOnboarding(email, { accountStatus: ACCOUNT_STATUS.APPROVED });
}

export function approveMerchantKyc(email) {
  return updateMerchantOnboarding(email, {
    kycStatus: KYC_STATUS.APPROVED,
    kycApprovedAt: new Date().toISOString(),
    kycRejectionReason: null,
  });
}

export function rejectMerchantKyc(email, reason = "") {
  const record = getMerchantOnboarding(email);

  return updateMerchantOnboarding(email, {
    kycStatus: KYC_STATUS.NOT_STARTED,
    kycRejectionReason: reason,
    kycRejectedAt: new Date().toISOString(),
    kycDraft: record?.kycData
      ? {
          currentStep: 1,
          formData: record.kycData,
          savedAt: new Date().toISOString(),
        }
      : record?.kycDraft ?? null,
  });
}

export function submitMerchantKyc(email, kycData) {
  const updated = updateMerchantOnboarding(email, {
    kycStatus: KYC_STATUS.SUBMITTED,
    kycData,
    kycDraft: null,
    kycSubmittedAt: new Date().toISOString(),
    kycRejectionReason: null,
    kycRejectedAt: null,
  });

  if (updated) {
    const merchantName = `${updated.firstName || ""} ${updated.lastName || ""}`.trim() || email;
    const notificationId = `${NOTIFICATION_TYPES.KYC_SUBMITTED}-${normalizeEmail(email)}`;
    clearDismissedNotification(notificationId);
    notifyAdminKycSubmitted({
      email,
      merchantName,
      kycData,
    });
  }

  return updated;
}

export function saveKycDraft(email, { currentStep, formData }) {
  return updateMerchantOnboarding(email, {
    kycDraft: {
      currentStep,
      formData,
      savedAt: new Date().toISOString(),
    },
  });
}

export function getKycDraft(email = getUserEmail()) {
  const record = getMerchantOnboarding(email);
  return record?.kycDraft || null;
}

export function getSubmittedKycRecords() {
  return getAllMerchantOnboardingRecords().filter(
    (record) => record.kycStatus === KYC_STATUS.SUBMITTED,
  );
}

export function getMerchantDisplayName(record) {
  const name = `${record?.firstName || ""} ${record?.lastName || ""}`.trim();
  return name || record?.email || "Merchant";
}

export function onboardingRecordToManagerRow(record) {
  const merchantName =
    `${record.firstName || ""} ${record.lastName || ""}`.trim() || record.email;

  let kycStatusLabel = "Pending";
  if (record.kycStatus === KYC_STATUS.SUBMITTED) {
    kycStatusLabel = "Under Review";
  } else if (record.kycStatus === KYC_STATUS.APPROVED) {
    kycStatusLabel = "Verified";
  }

  let merchantStatus = "Under Review";
  if (record.accountStatus === ACCOUNT_STATUS.APPROVED) {
    merchantStatus = record.kycStatus === KYC_STATUS.APPROVED ? "Active" : "Under Review";
  }

  return {
    merchantId: `MRC${record.userId}`,
    merchantName,
    businessType: record.kycData?.business?.businessType || "—",
    kycStatus: kycStatusLabel,
    transactionVolume: "—",
    merchantStatus,
    email: record.email,
    accountStatus: record.accountStatus,
    rawKycStatus: record.kycStatus,
    isOnboardingRecord: true,
  };
}
