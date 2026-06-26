// Gateway acquiring credentials are sourced from the environment, NOT the
// database and NOT the admin UI. Admin only chooses which configured gateway is
// active (status lives in platform_gateway_configs). The underlying processor
// (e.g. Razorpay) is never exposed to merchants or end users — to them it is
// always just "Paygate".
//
// To add a new acquiring gateway later: add an entry to GATEWAY_REGISTRY with a
// readCredentials() that pulls its keys from process.env.

const RAZORPAY = 'razorpay';

// Each registry entry describes a supported acquiring gateway and how to read
// its credentials from the environment. `configured` is true only when the
// required env vars are present, so the admin UI can show what's actually usable.
const GATEWAY_REGISTRY = {
  [RAZORPAY]: {
    provider: RAZORPAY,
    label: 'Razorpay',
    // Resolve credentials for the Razorpay client (client.js reads clientId /
    // clientSecret first, then providerConfig fallbacks).
    readCredentials: () => {
      const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
      const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
      const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
      if (!keyId || !keySecret) return null;

      const environment = keyId.startsWith('rzp_live_') ? 'production' : 'sandbox';
      return {
        gatewayProvider: RAZORPAY,
        clientId: keyId,
        clientSecret: keySecret,
        keyId,
        keySecret,
        keySecretLast4: keySecret.slice(-4),
        webhookSecret: webhookSecret || null,
        environment,
        providerConfig: {
          keyId,
          keySecret,
          webhookSecret: webhookSecret || null
        }
      };
    }
  }
};

const SUPPORTED_GATEWAYS = Object.keys(GATEWAY_REGISTRY);

const isSupported = (provider) =>
  Boolean(provider && GATEWAY_REGISTRY[String(provider).toLowerCase()]);

const getRegistryEntry = (provider) =>
  GATEWAY_REGISTRY[String(provider || '').toLowerCase()] || null;

// Full credentials (with secrets) for a gateway, or null if its env vars are
// missing. Used at payment time and for validation.
const getCredentials = (provider) => {
  const entry = getRegistryEntry(provider);
  return entry ? entry.readCredentials() : null;
};

// Whether a gateway has all required env credentials present.
const isConfigured = (provider) => Boolean(getCredentials(provider));

module.exports = {
  RAZORPAY,
  GATEWAY_REGISTRY,
  SUPPORTED_GATEWAYS,
  isSupported,
  getRegistryEntry,
  getCredentials,
  isConfigured
};
