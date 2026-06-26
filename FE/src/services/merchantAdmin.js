import { apiRequest } from "./api";

export function fetchPendingMerchantRequests() {
  return apiRequest("/api/auth/admin/merchants/pending");
}

export function fetchAllMerchants() {
  return apiRequest("/api/auth/admin/merchants/requests?status=all");
}

export function approveMerchant(merchantId) {
  return apiRequest(`/api/auth/admin/merchants/${merchantId}/approve`, {
    method: "PATCH",
  });
}

export function rejectMerchant(merchantId, reason) {
  return apiRequest(`/api/auth/admin/merchants/${merchantId}/reject`, {
    method: "PATCH",
    body: { reason },
  });
}
