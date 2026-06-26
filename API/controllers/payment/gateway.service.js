const MerchantGatewayConfig = require('../../models/merchantGatewayConfig.model');
const User = require('../../models/user.model');
const { serializeGatewayConfig } = require('../../config/gateway');
const {
  GATEWAY_PROVIDERS,
  VALID_ENVIRONMENTS,
  VALID_STATUSES,
  PROVIDER_LABELS
} = require('./payment.constants');
const { validatePhone, normalizePhone, resolveMerchantUserId } = require('./payment.shared');

const PROVIDER_REQUIREMENTS = {
  razorpay: {
    credentials: ['clientId', 'clientSecret'],
    optional: ['webhookSecret', 'providerConfig']
  }
};

const normalizeProvider = (provider) => {
  const normalized = String(provider || 'razorpay').toLowerCase();
  if (!GATEWAY_PROVIDERS.includes(normalized)) {
    return null;
  }
  return normalized;
};

const buildProviderConfig = (body, provider) => {
  const base = body.providerConfig && typeof body.providerConfig === 'object'
    ? { ...body.providerConfig }
    : {};

  // Merchant webhook / callback URL fired on a confirmed payment.
  if (body.callbackUrl) base.callbackUrl = body.callbackUrl;

  if (provider === 'razorpay') {
    if (body.keyId || body.key_id) base.keyId = body.keyId || body.key_id;
    if (body.webhookSecret || body.webhook_secret) {
      base.webhookSecret = body.webhookSecret || body.webhook_secret;
    }
  }

  return Object.keys(base).length > 0 ? base : null;
};

const connectGateway = async (req, body) => {
  const provider = normalizeProvider(body.gatewayProvider);
  if (!provider) {
    return {
      statusCode: 400,
      success: false,
      message: `gatewayProvider must be one of: ${GATEWAY_PROVIDERS.join(', ')}`
    };
  }

  const {
    merchantName,
    merchantPhone,
    clientId,
    clientSecret,
    clientVersion,
    environment,
    redirectUrl,
    webhookUsername,
    webhookPassword,
    phonepeMerchantId,
    externalMerchantId,
    googleMerchantId,
    status,
    merchantId: bodyMerchantId
  } = body;

  const requirements = PROVIDER_REQUIREMENTS[provider];
  const missing = requirements.credentials.filter((field) => !body[field]);

  if (!merchantName || !merchantPhone || missing.length > 0) {
    return {
      statusCode: 400,
      success: false,
      message: `merchantName, merchantPhone, ${requirements.credentials.join(', ')} are required for ${PROVIDER_LABELS[provider]}`
    };
  }

  if (!validatePhone(merchantPhone)) {
    return {
      statusCode: 400,
      success: false,
      message: 'merchantPhone must be a valid 10-digit Indian mobile number'
    };
  }

  const env = environment || 'sandbox';
  if (!VALID_ENVIRONMENTS.includes(env)) {
    return {
      statusCode: 400,
      success: false,
      message: `environment must be one of: ${VALID_ENVIRONMENTS.join(', ')}`
    };
  }

  const userId = resolveMerchantUserId(req, bodyMerchantId);

  if (req.user.role === 'admin' && bodyMerchantId) {
    const merchant = await User.findMerchantById(userId);
    if (!merchant) {
      return { statusCode: 404, success: false, message: 'Merchant not found' };
    }
  }

  const gatewayStatus = status || 'active';
  if (!VALID_STATUSES.includes(gatewayStatus)) {
    return {
      statusCode: 400,
      success: false,
      message: `status must be one of: ${VALID_STATUSES.join(', ')}`
    };
  }

  const resolvedExternalId = externalMerchantId || null;

  const config = await MerchantGatewayConfig.upsertForUser(userId, provider, {
    merchantName: String(merchantName).trim(),
    merchantPhone: normalizePhone(merchantPhone),
    externalMerchantId: resolvedExternalId,
    clientId: String(clientId).trim(),
    clientSecret: String(clientSecret).trim(),
    clientVersion: parseInt(clientVersion, 10) || 1,
    environment: env,
    redirectUrl: String(redirectUrl || '').trim(),
    webhookUsername: webhookUsername || null,
    webhookPassword: webhookPassword || null,
    providerConfig: buildProviderConfig(body, provider),
    status: gatewayStatus,
    activatedAt: gatewayStatus === 'active' ? new Date() : null
  });

  return {
    statusCode: 200,
    success: true,
    message: `${PROVIDER_LABELS[provider]} merchant account connected successfully`,
    data: { gateway: serializeGatewayConfig(config) }
  };
};

const getGatewayConfig = async (req, merchantIdParam, queryProvider) => {
  let userId = req.user.id;
  const provider = queryProvider ? normalizeProvider(queryProvider) : null;

  if (merchantIdParam) {
    if (req.user.role !== 'admin') {
      return { statusCode: 403, success: false, message: 'Admin access required' };
    }
    userId = parseInt(merchantIdParam, 10);
  }

  if (queryProvider && !provider) {
    return {
      statusCode: 400,
      success: false,
      message: `gatewayProvider must be one of: ${GATEWAY_PROVIDERS.join(', ')}`
    };
  }

  const config = await MerchantGatewayConfig.findByUserId(userId, provider || undefined);

  if (!config) {
    return {
      statusCode: 404,
      success: false,
      message: provider
        ? `${PROVIDER_LABELS[provider]} gateway is not configured for this merchant`
        : 'Payment gateway is not configured for this merchant'
    };
  }

  return {
    statusCode: 200,
    success: true,
    data: { gateway: serializeGatewayConfig(config) }
  };
};

const listGatewayConfigs = async (req, merchantIdParam) => {
  let userId = req.user.id;

  if (merchantIdParam) {
    if (req.user.role !== 'admin') {
      return { statusCode: 403, success: false, message: 'Admin access required' };
    }
    userId = parseInt(merchantIdParam, 10);
  }

  const configs = await MerchantGatewayConfig.listByUserId(userId);

  return {
    statusCode: 200,
    success: true,
    data: {
      count: configs.length,
      gateways: configs.map((config) => serializeGatewayConfig(config))
    }
  };
};

const updateGatewayConfig = async (req, body) => {
  const provider = normalizeProvider(body.gatewayProvider);
  if (!provider) {
    return {
      statusCode: 400,
      success: false,
      message: `gatewayProvider must be one of: ${GATEWAY_PROVIDERS.join(', ')}`
    };
  }

  const userId = resolveMerchantUserId(req, body.merchantId);
  const existing = await MerchantGatewayConfig.findByUserId(userId, provider);

  if (!existing) {
    return {
      statusCode: 404,
      success: false,
      message: `${PROVIDER_LABELS[provider]} gateway is not configured. Connect gateway first.`
    };
  }

  const changes = {};

  if (body.merchantName !== undefined) changes.merchantName = String(body.merchantName).trim();
  if (body.merchantPhone !== undefined) {
    if (!validatePhone(body.merchantPhone)) {
      return {
        statusCode: 400,
        success: false,
        message: 'merchantPhone must be a valid 10-digit Indian mobile number'
      };
    }
    changes.merchantPhone = normalizePhone(body.merchantPhone);
  }
  if (body.externalMerchantId !== undefined || body.phonepeMerchantId !== undefined) {
    changes.externalMerchantId = body.externalMerchantId || body.phonepeMerchantId;
  }
  if (body.clientId !== undefined) changes.clientId = String(body.clientId).trim();
  if (body.clientSecret !== undefined) changes.clientSecret = String(body.clientSecret).trim();
  if (body.clientVersion !== undefined) changes.clientVersion = parseInt(body.clientVersion, 10) || 1;
  if (body.environment !== undefined) {
    if (!VALID_ENVIRONMENTS.includes(body.environment)) {
      return {
        statusCode: 400,
        success: false,
        message: `environment must be one of: ${VALID_ENVIRONMENTS.join(', ')}`
      };
    }
    changes.environment = body.environment;
  }
  if (body.redirectUrl !== undefined) changes.redirectUrl = String(body.redirectUrl).trim();
  if (body.webhookUsername !== undefined) changes.webhookUsername = body.webhookUsername;
  if (body.webhookPassword !== undefined) changes.webhookPassword = body.webhookPassword;
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return {
        statusCode: 400,
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`
      };
    }
    changes.status = body.status;
    if (body.status === 'active') {
      changes.activatedAt = new Date();
    }
  }

  const providerConfig = buildProviderConfig(body, provider);
  if (providerConfig) {
    changes.providerConfig = { ...existing.providerConfig, ...providerConfig };
  }

  const updated = await MerchantGatewayConfig.update(existing.id, changes);

  return {
    statusCode: 200,
    success: true,
    message: `${PROVIDER_LABELS[provider]} gateway configuration updated`,
    data: { gateway: serializeGatewayConfig(updated) }
  };
};

module.exports = {
  connectGateway,
  getGatewayConfig,
  listGatewayConfigs,
  updateGatewayConfig
};
