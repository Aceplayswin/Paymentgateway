import { apiRequest } from "./api";
import { getRefreshToken } from "../utils/authStorage";

export function login(credentials) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export function register(userData) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: userData,
  });
}

export function verifyOtp(payload) {
  return apiRequest("/api/auth/verify-otp", {
    method: "POST",
    body: payload,
  });
}

export function resendOtp(payload) {
  return apiRequest("/api/auth/resend-otp", {
    method: "POST",
    body: payload,
  });
}

export function requestPasswordReset(payload) {
  return apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: payload,
  });
}

export function verifyResetOtp(payload) {
  return apiRequest("/api/auth/verify-reset-otp", {
    method: "POST",
    body: payload,
  });
}

export function resetPassword(payload) {
  return apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: payload,
  });
}

export function refreshSession() {
  return apiRequest("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken: getRefreshToken() },
    skipAuthRetry: true,
  });
}
