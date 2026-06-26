import { apiRequest } from "./api";

const BASE = "/api/admin";

// --- Platform acquiring gateways (admin only) -------------------------------
// Credentials live in the server environment, not the UI. The admin only sees
// which gateways are connected and chooses which one is active. The underlying
// processor is never exposed to merchants or end users — it's all "Paygate".

// Lists connected gateways with their active/inactive status.
export function listGateways() {
  return apiRequest(`${BASE}/gateway`);
}

// Activates / deactivates a gateway. The server refuses to deactivate the only
// connected gateway, or the last active one.
export function setGatewayStatus(gatewayProvider, status) {
  return apiRequest(`${BASE}/gateway/status`, {
    method: "PATCH",
    body: { gatewayProvider, status },
  });
}
