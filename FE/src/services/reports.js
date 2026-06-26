import { apiRequest } from "./api";

export async function getReportCenter() {
  const response = await apiRequest("/api/reports/center");
  return response.data;
}

export async function getSalesReport() {
  const response = await apiRequest("/api/reports/sales");
  return response.data;
}

export async function getMerchantReport() {
  const response = await apiRequest("/api/reports/merchant");
  return response.data;
}

export async function getReportsSummary() {
  const response = await apiRequest("/api/reports/summary");
  return response.data;
}
