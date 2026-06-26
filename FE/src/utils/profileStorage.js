import { getUserDisplayName, getUserEmail, getUserRole } from "./authStorage";
import { getMerchantOnboarding, updateMerchantOnboarding } from "./onboardingStorage";

const PROFILE_STORE_KEY = "paygate_user_profiles";
const MAX_AVATAR_BYTES = 1_000_000;

export const PROFILE_CHANGED_EVENT = "paygate-profile-changed";

function readStore() {
  const raw = localStorage.getItem(PROFILE_STORE_KEY);
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
  localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify(store));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function splitFullName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { firstName: "", lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function buildDefaultProfile(email = getUserEmail()) {
  const normalizedEmail = normalizeEmail(email);
  const isAdmin = getUserRole() === "admin";
  const displayName = getUserDisplayName() || (isAdmin ? "Admin User" : "Merchant User");
  const onboarding = getMerchantOnboarding(normalizedEmail);

  return {
    fullName: displayName,
    username: isAdmin ? "admin" : "merchant",
    email: normalizedEmail || (isAdmin ? "admin@paygate.com" : "merchant@paygate.com"),
    phone: onboarding?.phoneNumber || (isAdmin ? "+91 98765 43210" : "+91 91234 56789"),
    jobTitle: isAdmin ? "Administrator" : "Business Owner",
    department: isAdmin ? "Management" : "Operations",
    bio: isAdmin
      ? "Platform administrator responsible for content, security, and merchant operations."
      : onboarding?.kycData?.business?.legalName
        ? `Account owner for ${onboarding.kycData.business.legalName}.`
        : "Merchant account owner managing payments and business operations.",
    location: isAdmin ? "Mumbai, India" : "Bengaluru, India",
    dateOfBirth: onboarding?.kycData?.personal?.dateOfBirth || "1990-05-15",
    joinDate: onboarding?.registeredAt
      ? new Date(onboarding.registeredAt).toISOString().slice(0, 10)
      : "2024-01-15",
    avatarUrl: null,
  };
}

export function getUserProfile(email = getUserEmail()) {
  const normalizedEmail = normalizeEmail(email);
  const store = readStore();
  const saved = store[normalizedEmail];

  if (!saved) {
    return buildDefaultProfile(normalizedEmail);
  }

  return {
    ...buildDefaultProfile(normalizedEmail),
    ...saved,
    email: saved.email || normalizedEmail,
  };
}

export function saveUserProfile(profile, previousEmail = getUserEmail()) {
  const normalizedPrevious = normalizeEmail(previousEmail);
  const normalizedNext = normalizeEmail(profile.email) || normalizedPrevious;
  const store = readStore();

  const payload = {
    ...profile,
    email: normalizedNext,
    updatedAt: new Date().toISOString(),
  };

  if (normalizedPrevious && normalizedPrevious !== normalizedNext) {
    delete store[normalizedPrevious];
  }

  store[normalizedNext] = payload;
  writeStore(store);

  localStorage.setItem("paygate_user_name", profile.fullName || "");
  localStorage.setItem("paygate_user_email", normalizedNext);

  if (getUserRole() === "merchant") {
    const { firstName, lastName } = splitFullName(profile.fullName);
    updateMerchantOnboarding(normalizedNext, {
      firstName,
      lastName,
      phoneNumber: profile.phone,
      email: normalizedNext,
    });
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROFILE_CHANGED_EVENT));
  }

  return payload;
}

export async function readAvatarFile(file) {
  if (!file) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file (JPG, PNG, or WebP).");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Profile image must be 1 MB or smaller.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}
