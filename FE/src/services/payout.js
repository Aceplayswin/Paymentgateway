import { apiRequest } from "./api";

export async function getPayoutBalance() {
  const response = await apiRequest("/api/payout/balance");
  return response.data;
}

export async function listPayoutTransactions(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  const response = await apiRequest(`/api/payout/transactions${query ? `?${query}` : ""}`);
  return { rows: response.data ?? [], pagination: response.pagination };
}

export async function listLedgerEntries(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  const response = await apiRequest(`/api/payout/ledger${query ? `?${query}` : ""}`);
  return { rows: response.data ?? [], pagination: response.pagination };
}

export async function listIpWhitelist(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  const response = await apiRequest(`/api/payout/ip-whitelist${query ? `?${query}` : ""}`);
  return { rows: response.data ?? [], pagination: response.pagination };
}
