import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
} from "../utils/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

let refreshPromise = null;
const AUTH_PUBLIC_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify-otp",
  "/api/auth/resend-otp",
  "/api/auth/forgot-password",
  "/api/auth/verify-reset-otp",
  "/api/auth/reset-password",
  "/api/auth/refresh",
]);

function toNetworkError(error) {
  const networkError = new Error(
    "Unable to reach the server. Make sure the API is running and try again."
  );
  networkError.isNetworkError = true;
  networkError.cause = error;
  return networkError;
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function isTokenExpiredMessage(message) {
  const text = String(message || "").toLowerCase();
  return text.includes("token expired") || text.includes("jwt expired");
}

function canAttemptAuthRecovery(path, options = {}) {
  if (options.skipAuthRetry) {
    return false;
  }

  return !AUTH_PUBLIC_PATHS.has(path);
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("Refresh token missing. Please login again.");
      }

      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        throw toNetworkError(error);
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.data?.accessToken) {
        throw new Error(data.message || "Unable to refresh session");
      }

      updateAccessToken(data.data.accessToken);
      return data.data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest(path, options = {}, isRetry = false) {
  const { method = "GET", body, headers = {}, credentials, skipAuthRetry = false } = options;
  let token = getAccessToken();
  const shouldRecoverAuth = canAttemptAuthRecovery(path, options);

  if (!token && !isRetry && shouldRecoverAuth && getRefreshToken()) {
    try {
      token = await refreshAccessToken();
    } catch {
      clearAuthSession();
    }
  }

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...headers,
      },
      credentials: credentials ?? "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw toNetworkError(error);
  }

  if (response.status === 401 && !isRetry && !skipAuthRetry) {
    const errorData = await response.clone().json().catch(() => ({}));
    const shouldTryRefresh =
      shouldRecoverAuth &&
      (isTokenExpiredMessage(errorData.message) || Boolean(getRefreshToken()));
    if (shouldTryRefresh) {
      try {
        await refreshAccessToken();
        return apiRequest(path, options, true);
      } catch {
        clearAuthSession();
      }
    }
  }

  return parseResponse(response);
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
