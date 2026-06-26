const PlatformGatewayConfig = require('../../models/platformGatewayConfig.model');
const {
  SUPPORTED_GATEWAYS,
  getRegistryEntry,
  getCredentials,
  isSupported
} = require('../../config/gatewayCredentials');

// Admin-facing management of the platform's acquiring gateways. Credentials are
// sourced from the ENVIRONMENT (config/gatewayCredentials) — the admin does NOT
// enter them here. The admin only chooses which connected gateway is active;
// payments route through the active one. The underlying processor is never
// exposed to merchants or end users — to them it is always just "Paygate".

// Public, secret-free view of one gateway for the admin UI. Combines what the
// environment provides (whether it's connected/configured) with the DB status
// (whether the admin has it active).
const serializeGateway = (provider, statusRow) => {
  const entry = getRegistryEntry(provider);
  const credentials = getCredentials(provider);
  const configured = Boolean(credentials);

  return {
    gatewayProvider: provider,
    label: entry?.label || provider,
    // "connected" = credentials are present in the environment.
    connected: configured,
    configured,
    environment: credentials?.environment || null,
    // Masked, read-only proof the keys are wired — never the full secret.
    keyId: credentials?.keyId || null,
    keySecretMasked: credentials?.keySecretLast4 ? `****${credentials.keySecretLast4}` : null,
    webhookConfigured: Boolean(credentials?.webhookSecret),
    status: statusRow?.status || 'inactive',
    active: statusRow?.status === 'active',
    activatedAt: statusRow?.activatedAt || null,
    updatedAt: statusRow?.updatedAt || null
  };
};

// Lists every supported gateway with its connection + active status.
const listGateways = async () => {
  const statusRows = await PlatformGatewayConfig.findAll();
  const statusByProvider = new Map(statusRows.map((row) => [row.gatewayProvider, row]));

  const gateways = SUPPORTED_GATEWAYS.map((provider) =>
    serializeGateway(provider, statusByProvider.get(provider))
  );

  const activeCount = gateways.filter((g) => g.active).length;
  const connectedCount = gateways.filter((g) => g.connected).length;

  return {
    statusCode: 200,
    success: true,
    data: {
      gateways,
      activeProvider: gateways.find((g) => g.active)?.gatewayProvider || null,
      // The UI uses this to lock the toggle: a single connected gateway can't be
      // deactivated (there must always be one acquiring route available).
      onlyOneConnected: connectedCount <= 1,
      activeCount
    }
  };
};

// Activates / deactivates a gateway. Rules:
//   - the gateway must be supported AND connected (env credentials present);
//   - deactivating is refused when it is the only connected gateway, or when it
//     is the last active one, so payments are never left without an acquirer.
const setStatus = async (req, body = {}) => {
  const provider = String(body.gatewayProvider || body.provider || '').toLowerCase();
  const status = String(body.status || '').toLowerCase();

  if (!isSupported(provider)) {
    return { statusCode: 400, success: false, message: 'Unsupported gateway provider.' };
  }
  if (!['active', 'inactive'].includes(status)) {
    return { statusCode: 400, success: false, message: 'status must be active or inactive.' };
  }

  const credentials = getCredentials(provider);
  if (!credentials) {
    const entry = getRegistryEntry(provider);
    return {
      statusCode: 400,
      success: false,
      message: `${entry?.label || provider} is not connected. Add its credentials to the server environment first.`
    };
  }

  const statusRows = await PlatformGatewayConfig.findAll();
  const connectedProviders = SUPPORTED_GATEWAYS.filter((p) => Boolean(getCredentials(p)));

  if (status === 'inactive') {
    // Can't deactivate the only connected gateway.
    if (connectedProviders.length <= 1) {
      return {
        statusCode: 400,
        success: false,
        message: 'This is the only connected gateway, so it cannot be deactivated.'
      };
    }
    // Can't deactivate the last active gateway (must keep one acquiring route).
    const activeProviders = statusRows
      .filter((row) => row.status === 'active')
      .map((row) => row.gatewayProvider);
    if (activeProviders.length <= 1 && activeProviders.includes(provider)) {
      return {
        statusCode: 400,
        success: false,
        message: 'At least one gateway must stay active. Activate another gateway before deactivating this one.'
      };
    }
  }

  await PlatformGatewayConfig.setStatus(provider, status, req.user?.id ?? null);
  const entry = getRegistryEntry(provider);
  const result = await listGateways();

  return {
    statusCode: 200,
    success: true,
    message: `${entry?.label || provider} marked ${status}.`,
    data: result.data
  };
};

module.exports = {
  serializeGateway,
  listGateways,
  setStatus
};
