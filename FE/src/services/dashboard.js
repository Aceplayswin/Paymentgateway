import { apiRequest } from "./api";

export async function getDashboardSummary() {
  const response = await apiRequest("/api/dashboard/summary");
  return response.data;
}
