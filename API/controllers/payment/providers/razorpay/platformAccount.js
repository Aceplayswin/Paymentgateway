const PlatformGatewayConfig = require('../../../../models/platformGatewayConfig.model');
const MerchantGatewayConfig = require('../../../../models/merchantGatewayConfig.model');
const { getCredentials, RAZORPAY } = require('../../../../config/gatewayCredentials');

// Acquiring credentials now come from the ENVIRONMENT (config/gatewayCredentials),
// never the DB or the admin UI. The DB only records which gateway the admin has
// activated. Every merchant's payment uses the active platform gateway's keys.
// The underlying processor is never exposed to merchants/users — it's "Paygate".

const PROVIDER = RAZORPAY;

// Resolves the active platform gateway credentials (from env), or null when the
// admin hasn't activated a gateway or its env credentials are missing.
const resolveActivePlatform = async () => {
  const activeProvider = await PlatformGatewayConfig.findActiveProvider();
  if (!activeProvider) return null;
  const credentials = getCredentials(activeProvider);
  if (!credentials) return null;

  return {
    ...credentials,
    status: 'active',
    // merchantName powers the Razorpay checkout title; merged per-merchant below.
    merchantName: 'Payment',
    redirectUrl: null
  };
};

// Returns the active platform credentials config, or null. Falls back to a
// per-merchant config (legacy) when a userId is supplied and no platform gateway
// is active, so existing merchant setups keep working during the transition.
const resolveCredentials = async (userId) => {
  const platform = await resolveActivePlatform();
  if (platform) return platform;

  if (userId) {
    return MerchantGatewayConfig.findActiveByUserId(userId, PROVIDER);
  }
  return null;
};

// Merges platform credentials (from env) with the merchant's own gateway config
// so the checkout shows the merchant name and the confirmed-payment webhook fires
// to the merchant's callbackUrl, while authentication uses the platform keys.
const resolveForMerchant = async (userId) => {
  const platform = await resolveActivePlatform();
  if (!platform) {
    // No active platform gateway: fall back entirely to the merchant config (legacy).
    return userId ? MerchantGatewayConfig.findActiveByUserId(userId, PROVIDER) : null;
  }

  const merchant = userId
    ? await MerchantGatewayConfig.findByUserId(userId, PROVIDER)
    : null;

  return {
    ...platform,
    // Prefer the merchant's display name + callback URL when present.
    merchantName: merchant?.merchantName || platform.merchantName,
    redirectUrl: merchant?.redirectUrl || platform.redirectUrl || null,
    providerConfig: {
      ...platform.providerConfig,
      callbackUrl: merchant?.providerConfig?.callbackUrl || null
    }
  };
};

module.exports = {
  PROVIDER,
  resolveActivePlatform,
  resolveCredentials,
  resolveForMerchant
};
