import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchPendingMerchantRequests } from "../services/merchantAdmin";
import { getUserRole } from "../utils/authStorage";
import {
  dismissAdminNotification,
  dismissAllAdminNotifications,
  getAdminNotifications,
  getUnreadNotificationCount,
  NOTIFICATION_TYPES,
  notifyAdminKycSubmitted,
  notifyAdminMerchantRequest,
  upsertAdminNotification,
} from "../utils/notificationStorage";
import {
  getAllMerchantOnboardingRecords,
  KYC_STATUS,
  ONBOARDING_CHANGED_EVENT,
} from "../utils/onboardingStorage";

const AdminNotificationContext = createContext(null);

function formatMerchantName(record) {
  const name = `${record.firstName || ""} ${record.lastName || ""}`.trim();
  return name || record.email;
}

function formatApiMerchantName(merchant) {
  const name = `${merchant.firstName || ""} ${merchant.lastName || ""}`.trim();
  return name || merchant.username || merchant.email;
}

async function syncNotificationsFromSources() {
  if (getUserRole() !== "admin") {
    return getAdminNotifications();
  }

  try {
    const response = await fetchPendingMerchantRequests();
    const pendingRequests = response.data?.pendingRequests || [];

    pendingRequests.forEach((merchant) => {
      notifyAdminMerchantRequest({
        merchantId: merchant.merchantId,
        merchantName: formatApiMerchantName(merchant),
        email: merchant.email,
      });
    });
  } catch {
    // Keep cached notifications when API is unavailable.
  }

  getAllMerchantOnboardingRecords()
    .filter((record) => record.kycStatus === KYC_STATUS.SUBMITTED)
    .forEach((record) => {
      notifyAdminKycSubmitted({
        email: record.email,
        merchantName: formatMerchantName(record),
        kycData: record.kycData,
      });
    });

  return getAdminNotifications();
}

export function AdminNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (getUserRole() !== "admin") {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const items = await syncNotificationsFromSources();
    setNotifications(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 30000);
    const handleFocus = () => refresh();
    const handleChange = () => refresh();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("paygate-notifications-changed", handleChange);
    window.addEventListener(ONBOARDING_CHANGED_EVENT, handleChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("paygate-notifications-changed", handleChange);
      window.removeEventListener(ONBOARDING_CHANGED_EVENT, handleChange);
    };
  }, [refresh]);

  const counts = useMemo(() => {
    const unread = notifications.filter((item) => !item.read);
    return {
      total: unread.length,
      merchantRequests: unread.filter((item) => item.type === NOTIFICATION_TYPES.MERCHANT_REQUEST)
        .length,
      kycRequests: unread.filter((item) => item.type === NOTIFICATION_TYPES.KYC_SUBMITTED).length,
    };
  }, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      counts,
      loading,
      refresh,
      dismissNotification: (id) => {
        dismissAdminNotification(id);
        setNotifications(getAdminNotifications());
      },
      dismissAllNotifications: () => {
        dismissAllAdminNotifications();
        setNotifications(getAdminNotifications());
      },
      upsertNotification: (notification) => {
        upsertAdminNotification(notification);
        setNotifications(getAdminNotifications());
      },
    }),
    [notifications, counts, loading, refresh],
  );

  return (
    <AdminNotificationContext.Provider value={value}>{children}</AdminNotificationContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    return {
      notifications: [],
      counts: { total: 0, merchantRequests: 0, kycRequests: 0 },
      loading: false,
      refresh: async () => {},
      dismissNotification: () => {},
      dismissAllNotifications: () => {},
      upsertNotification: () => {},
    };
  }
  return context;
}

export { getUnreadNotificationCount };
