const maskSecret = (value) => {
  if (!value) return null;
  const str = String(value);
  if (str.length <= 4) return '****';
  return `${'*'.repeat(Math.min(str.length - 4, 12))}${str.slice(-4)}`;
};

const maskProviderConfig = (config, includeSecrets = false) => {
  if (!config || typeof config !== 'object') return {};

  const masked = { ...config };
  const secretKeys = ['webhookSecret'];

  for (const key of secretKeys) {
    if (masked[key] && !includeSecrets) {
      masked[key] = maskSecret(masked[key]);
    }
  }

  return masked;
};

const serializeGatewayConfig = (config, { includeSecrets = false } = {}) => {
  if (!config) return null;

  const providerConfig =
    typeof config.providerConfig === 'string'
      ? JSON.parse(config.providerConfig || '{}')
      : config.providerConfig || {};

  return {
    id: config.id,
    userId: config.userId,
    gatewayProvider: config.gatewayProvider,
    merchantName: config.merchantName,
    merchantPhone: config.merchantPhone,
    externalMerchantId: config.externalMerchantId || config.phonepeMerchantId,
    clientId: config.clientId,
    clientSecret: includeSecrets ? config.clientSecret : maskSecret(config.clientSecret),
    clientVersion: config.clientVersion,
    environment: config.environment,
    redirectUrl: config.redirectUrl,
    webhookUsername: config.webhookUsername,
    webhookPassword: includeSecrets
      ? config.webhookPassword
      : maskSecret(config.webhookPassword),
    providerConfig: maskProviderConfig(providerConfig, includeSecrets),
    status: config.status,
    activatedAt: config.activatedAt,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt
  };
};

module.exports = {
  maskSecret,
  serializeGatewayConfig
};
