import { apiRequest } from "./api";

const BASE = "/api/developer";

// Lists the merchant's active API keys (public fields only).
export function listApiKeys() {
  return apiRequest(`${BASE}/api-keys`);
}

// Generates (or regenerates) the API key for a mode ("test" | "live").
// Returns the one-time plaintext secret in data.secret.
export function generateApiKey(mode = "test") {
  return apiRequest(`${BASE}/api-keys/generate`, {
    method: "POST",
    body: { mode },
  });
}

export function revokeApiKey(mode = "test") {
  return apiRequest(`${BASE}/api-keys/revoke`, {
    method: "POST",
    body: { mode },
  });
}
