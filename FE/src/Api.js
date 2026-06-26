import { apiRequest } from "./services/api";

export function fetchDashboardSummary() {
  return apiRequest("/api/dashboard/summary");
}

export function fetchPayinSummary() {
  return apiRequest("/api/payin/summary");
}

export function fetchPayinTransactions({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiRequest(`/api/payin/transactions?${params}`);
}

export function fetchRefundCallbacks({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiRequest(`/api/payin/refund-callbacks?${params}`);
}

export function fetchPayinSettlements({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiRequest(`/api/payin/settlements?${params}`);
}

export function fetchPayinSalesReport() {
  return apiRequest("/api/payin/sales-report");
}

export function fetchPayinChargebacksLiens({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiRequest(`/api/payin/chargebacks-liens?${params}`);
}

export function fetchPayinComplaints({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiRequest(`/api/payin/complaints?${params}`);
}

export function fetchPayinReports() {
  return apiRequest("/api/payin/reports");
}

export function fetchReportsCenter() {
  return apiRequest("/api/reports/center");
}

export function fetchReportsSales() {
  return apiRequest("/api/reports/sales");
}

export function fetchReportsMerchant() {
  return apiRequest("/api/reports/merchant");
}

export function fetchReportsSummary() {
  return apiRequest("/api/reports/summary");
}

export function fetchPayinMerchantReport() {
  return apiRequest("/api/payin/merchant-report");
}

export function fetchPayoutBalance() {
  return apiRequest("/api/payout/balance");
}

export function fetchPayoutTransactions({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiRequest(`/api/transactions/payout?${params}`);
}

export function fetchPayoutLedger({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiRequest(`/api/transactions/ledger?${params}`);
}

export function fetchPayoutIpWhitelist({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiRequest(`/api/settings/ip-whitelist?${params}`);
}
