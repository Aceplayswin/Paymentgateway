const NOTIFICATIONS_KEY = "paygate_admin_notifications";
const DISMISSED_IDS_KEY = "paygate_dismissed_notification_ids";

export const NOTIFICATION_TYPES = {
  MERCHANT_REQUEST: "merchant_request",
  KYC_SUBMITTED: "kyc_submitted",
};

function readStore() {
  const raw = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeStore(items) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
}

function readDismissedIds() {
  const raw = localStorage.getItem(DISMISSED_IDS_KEY);
  if (!raw) {
    return new Set();
  }

  try {
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function writeDismissedIds(ids) {
  localStorage.setItem(DISMISSED_IDS_KEY, JSON.stringify([...ids]));
}

export function emitNotificationsChanged() {
  window.dispatchEvent(new CustomEvent("paygate-notifications-changed"));
}

export function getAdminNotifications() {
  const store = readStore();
  const active = store.filter((item) => !item.read);

  if (active.length !== store.length) {
    writeStore(active);
  }

  return active.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export function getUnreadNotificationCount() {
  return getAdminNotifications().filter((item) => !item.read).length;
}

export function upsertAdminNotification(notification) {
  if (readDismissedIds().has(notification.id)) {
    return null;
  }

  const store = readStore();
  const index = store.findIndex((item) => item.id === notification.id);
  const nextItem = {
    read: false,
    createdAt: new Date().toISOString(),
    ...notification,
  };

  if (index >= 0) {
    const existing = store[index];
    store[index] = {
      ...nextItem,
      read: existing.read,
      createdAt: existing.createdAt || nextItem.createdAt,
    };
  } else {
    store.unshift(nextItem);
  }

  writeStore(store.slice(0, 100));
  emitNotificationsChanged();
  return nextItem;
}

export function markNotificationRead(id) {
  const store = readStore();
  const updated = store.map((item) => (item.id === id ? { ...item, read: true } : item));
  writeStore(updated);
  emitNotificationsChanged();
}

export function markAllNotificationsRead() {
  const store = readStore().map((item) => ({ ...item, read: true }));
  writeStore(store);
  emitNotificationsChanged();
}

export function dismissAdminNotification(id) {
  const dismissedIds = readDismissedIds();
  dismissedIds.add(id);
  writeDismissedIds(dismissedIds);

  const store = readStore().filter((item) => item.id !== id);
  writeStore(store);
  emitNotificationsChanged();
}

export function dismissAllAdminNotifications() {
  const store = readStore();
  const dismissedIds = readDismissedIds();
  store.forEach((item) => dismissedIds.add(item.id));
  writeDismissedIds(dismissedIds);
  writeStore([]);
  emitNotificationsChanged();
}

export function clearDismissedNotification(id) {
  const dismissedIds = readDismissedIds();
  dismissedIds.delete(id);
  writeDismissedIds(dismissedIds);
}

export function notifyAdminMerchantRequest({ merchantId, merchantName, email }) {
  return upsertAdminNotification({
    id: `${NOTIFICATION_TYPES.MERCHANT_REQUEST}-${email || merchantId}`,
    type: NOTIFICATION_TYPES.MERCHANT_REQUEST,
    title: "New Merchant Request",
    message: `${merchantName || email} requested account approval.`,
    link: "/merchant/new-request",
    entityId: email || merchantId,
    email,
  });
}

function formatKycNotificationDetails(kycData) {
  if (!kycData) {
    return "";
  }

  const parts = [
    kycData.business?.legalName?.trim(),
    kycData.business?.businessType?.trim(),
    kycData.business?.gstin?.trim(),
  ].filter(Boolean);

  return parts.join(" · ");
}

export function notifyAdminKycSubmitted({ email, merchantName, kycData }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const kycDetails = formatKycNotificationDetails(kycData);
  const displayName = merchantName || normalizedEmail;

  return upsertAdminNotification({
    id: `${NOTIFICATION_TYPES.KYC_SUBMITTED}-${normalizedEmail}`,
    type: NOTIFICATION_TYPES.KYC_SUBMITTED,
    title: "KYC Details Submitted",
    message: kycDetails
      ? `${displayName} submitted KYC for review — ${kycDetails}.`
      : `${displayName} submitted KYC documents for review.`,
    link: `/merchant/kyc-review/${encodeURIComponent(normalizedEmail)}`,
    entityId: normalizedEmail,
    email: normalizedEmail,
    kycDetails,
  });
}
