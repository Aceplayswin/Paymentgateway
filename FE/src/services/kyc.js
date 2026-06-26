import { apiRequest } from "./api";

export function getKycStatus() {
  return apiRequest("/api/kyc/status");
}

export function saveKycDraft(payload) {
  return apiRequest("/api/kyc/draft", {
    method: "PUT",
    body: payload,
  });
}

export function submitKyc(payload) {
  return apiRequest("/api/kyc/submit", {
    method: "POST",
    body: payload,
  });
}

export function fetchSubmittedKycRequests() {
  return apiRequest("/api/kyc/admin/requests");
}

export function fetchMerchantKyc(merchantId) {
  return apiRequest(`/api/kyc/admin/merchants/${merchantId}`);
}

export function approveMerchantKyc(merchantId) {
  return apiRequest(`/api/kyc/admin/merchants/${merchantId}/approve`, {
    method: "PATCH",
  });
}

export function rejectMerchantKyc(merchantId, reason) {
  return apiRequest(`/api/kyc/admin/merchants/${merchantId}/reject`, {
    method: "PATCH",
    body: { reason },
  });
}
