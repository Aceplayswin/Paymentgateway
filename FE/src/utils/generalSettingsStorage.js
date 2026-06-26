import { getUserEmail, getUserRole } from "./authStorage";

const SETTINGS_STORE_KEY = "paygate_general_settings";

export const SETTINGS_CHANGED_EVENT = "paygate-settings-changed";

const DEFAULT_MERCHANT_SETTINGS = {
  notifications: {
    emailAlerts: true,
    transactionAlerts: true,
    riskAlerts: true,
  },
};

const DEFAULT_ADMIN_SETTINGS = {
  systemMonitoring: true,
  platformAlerting: {
    email: true,
    slack: true,
  },
  securityPolicy: {
    mfaEnforcement: true,
  },
  auditLogging: {
    retentionDays: 90,
  },
};

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getDefaultSettings() {
  return getUserRole() === "admin"
    ? structuredClone(DEFAULT_ADMIN_SETTINGS)
    : structuredClone(DEFAULT_MERCHANT_SETTINGS);
}

function readStore() {
  const raw = localStorage.getItem(SETTINGS_STORE_KEY);
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
  localStorage.setItem(SETTINGS_STORE_KEY, JSON.stringify(store));
}

function emitSettingsChanged() {
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT));
}

function mergeSettings(defaults, saved) {
  if (!saved || typeof saved !== "object") {
    return defaults;
  }

  const merged = { ...defaults, ...saved };

  Object.keys(defaults).forEach((key) => {
    if (
      defaults[key] &&
      typeof defaults[key] === "object" &&
      !Array.isArray(defaults[key])
    ) {
      merged[key] = { ...defaults[key], ...(saved[key] || {}) };
    }
  });

  return merged;
}

export function getGeneralSettings(email = getUserEmail()) {
  const key = normalizeEmail(email) || "default";
  const store = readStore();
  return mergeSettings(getDefaultSettings(), store[key]);
}

export function saveGeneralSettings(settings, email = getUserEmail()) {
  const key = normalizeEmail(email) || "default";
  const store = readStore();
  store[key] = mergeSettings(getDefaultSettings(), settings);
  writeStore(store);
  emitSettingsChanged();
  return store[key];
}
