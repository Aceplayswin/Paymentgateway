const MerchantGatewayConfig = require('../../models/merchantGatewayConfig.model');
const gatewayService = require('./gateway.service');
const razorpayService = require('./razorpay.service');
const platformAccount = require('./providers/razorpay/platformAccount');
const { GATEWAY_PROVIDERS, PROVIDER_LABELS } = require('./payment.constants');

// Razorpay is the only acquiring processor. The provider dispatch indirection
// from the legacy multi-provider design is collapsed to a single service.
const PROVIDER_SERVICES = {
  razorpay: razorpayService
};

const normalizeProvider = (provider) => {
  const normalized = String(provider || '').toLowerCase();
  return GATEWAY_PROVIDERS.includes(normalized) ? normalized : null;
};

const getProviderService = (provider) => {
  const normalized = normalizeProvider(provider);
  if (!normalized) return null;
  return PROVIDER_SERVICES[normalized];
};

const invalidProvider = () => ({
  statusCode: 400,
  success: false,
  message: `Invalid gateway provider. Supported: ${GATEWAY_PROVIDERS.join(', ')}`
});

const resolveActiveConfig = async (req, provider, body = {}) => {
  const userId =
    req.user.role === 'merchant'
      ? req.user.id
      : body.merchantId || req.query?.merchantId || req.user.id;

  // Credentials come from the single platform-wide Razorpay account (Admin
  // configured); merchant display/callback settings are merged in.
  const config = await platformAccount.resolveForMerchant(userId);
  if (!config) {
    return {
      error: {
        statusCode: 400,
        success: false,
        message: `${PROVIDER_LABELS[provider]} is not available. The platform gateway has not been configured by the admin yet.`
      }
    };
  }

  return { config, userId };
};

const initiatePayment = async (req, provider, body) => {
  const service = getProviderService(provider);
  if (!service) return invalidProvider();

  const resolved = await resolveActiveConfig(req, provider, body);
  if (resolved.error) return resolved.error;

  return service.initiatePayment(req, body, resolved.config);
};

const getOrderStatus = async (req, provider, merchantOrderId) => {
  const service = getProviderService(provider);
  if (!service) return invalidProvider();

  const resolved = await resolveActiveConfig(req, provider, req.query);
  if (resolved.error) return resolved.error;

  return service.getOrderStatus(req, merchantOrderId, resolved.config);
};

const handleWebhook = async (provider, authorizationHeader, rawBody, options = {}) => {
  const service = getProviderService(provider);
  if (!service) return invalidProvider();

  return service.handleWebhook(authorizationHeader, rawBody, options.signature);
};

// Acquiring credentials are now sourced from the environment, and the admin
// only chooses which platform gateway is active (status in the DB). Merchants
// never supply keys, so this legacy onboarding endpoint just reports whether a
// platform gateway is currently active and available.
const connectRazorpay = async () => {
  const active = await platformAccount.resolveActivePlatform();
  if (!active) {
    return {
      statusCode: 409,
      success: false,
      message: `${PROVIDER_LABELS.razorpay} is configured centrally by the platform admin and is not yet available.`
    };
  }
  return {
    statusCode: 200,
    success: true,
    message: `${PROVIDER_LABELS.razorpay} is enabled for your account via the platform gateway.`,
    data: { gatewayProvider: 'razorpay', environment: active.environment }
  };
};

// Public hosted payment page data: resolves a payment link to the order plus the
// Razorpay checkout payload. Link is valid for 5 minutes.
const getHostedPayment = async (linkToken) => {
  const PaymentLink = require('../../models/paymentLink.model');
  const PayinTransaction = require('../../models/payinTransaction.model');

  const { link, expired } = await PaymentLink.findValidByToken(linkToken);
  if (!link) {
    return { statusCode: 404, success: false, message: 'Token not found or expired' };
  }
  if (expired) {
    return { statusCode: 410, success: false, message: 'Token has expired' };
  }

  const transaction = await PayinTransaction.findByOrderId({ orderId: link.orderId });
  if (!transaction) {
    return { statusCode: 404, success: false, message: 'Order not found' };
  }

  const config = await platformAccount.resolveForMerchant(transaction.userId);
  const checkout = razorpayService.getHostedCheckout(config, transaction);

  return {
    statusCode: 200,
    success: true,
    data: {
      gatewayProvider: 'razorpay',
      merchantOrderId: transaction.orderId,
      byteTransactionId: transaction.byteTransactionId,
      amount: transaction.amount,
      currency: 'INR',
      checkout,
      redirectUrl: transaction.redirectUrl,
      status: transaction.status,
      requiresCheckout: true
    }
  };
};

// Customer-facing verify from the hosted payment page. Razorpay confirms via the
// checkout signature (or a status poll on the byteTransactionId).
const verifyHostedPayment = async (
  provider,
  { byteTransactionId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
) => {
  const normalized = normalizeProvider(provider);
  if (!normalized) return invalidProvider();

  return razorpayService.verifyByByteTransactionId(byteTransactionId, {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  });
};

module.exports = {
  connectGateway: gatewayService.connectGateway,
  getGatewayConfig: gatewayService.getGatewayConfig,
  listGatewayConfigs: gatewayService.listGatewayConfigs,
  updateGatewayConfig: gatewayService.updateGatewayConfig,
  initiatePayment,
  getOrderStatus,
  handleWebhook,
  connectRazorpay,
  getHostedPayment,
  verifyHostedPayment,
  GATEWAY_PROVIDERS
};
