const PENDING_OTP_KEY = "paygate_pending_otp";

const AUTH_KEYS = [
  "paygate_auth",
  "paygate_access_token",
  "paygate_refresh_token",
  "paygate_user_id",
  "paygate_user_role",
  "paygate_user_name",
  "paygate_user_email",
  "paygate_user_approval_status",
];

export function saveAuthSession({ user, accessToken, refreshToken }) {
  const role = user.role === "admin" ? "admin" : "merchant";

  localStorage.setItem("paygate_auth", "true");
  localStorage.setItem("paygate_access_token", accessToken);
  if (refreshToken) {
    localStorage.setItem("paygate_refresh_token", refreshToken);
  }
  localStorage.setItem("paygate_user_id", String(user.id));
  localStorage.setItem("paygate_user_role", role);
  localStorage.setItem(
    "paygate_user_name",
    `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || user.email
  );
  localStorage.setItem("paygate_user_email", user.email);
  localStorage.setItem("paygate_user_approval_status", user.approvalStatus || "pending");
}

export function clearAuthenticatedSession() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function clearAuthSession() {
  clearAuthenticatedSession();
  clearPendingOtpSession();
}

export function savePendingOtpSession({
  otpSessionId,
  email,
  flow = "signup",
  otpVerified = false,
}) {
  sessionStorage.setItem(
    PENDING_OTP_KEY,
    JSON.stringify({ otpSessionId, email, flow, otpVerified })
  );
}

export function getPendingOtpSession() {
  const raw = sessionStorage.getItem(PENDING_OTP_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPendingOtpSession() {
  sessionStorage.removeItem(PENDING_OTP_KEY);
}

export function isAuthenticated() {
  return localStorage.getItem("paygate_auth") === "true";
}

export function getAccessToken() {
  return localStorage.getItem("paygate_access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("paygate_refresh_token");
}

export function updateAccessToken(accessToken) {
  if (accessToken) {
    localStorage.setItem("paygate_access_token", accessToken);
  }
}

export function getUserRole() {
  const role = localStorage.getItem("paygate_user_role");
  return role === "admin" ? "admin" : "merchant";
}

export function getDashboardPath(role = getUserRole()) {
  return role === "admin" ? "/dashboard/admin" : "/dashboard/merchant";
}

export function getUserDisplayName() {
  return localStorage.getItem("paygate_user_name") || "";
}

export function getUserEmail() {
  return localStorage.getItem("paygate_user_email") || "";
}
