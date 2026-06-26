// Razorpay is the sole (hidden) acquiring processor for this white-label gateway.
const GATEWAY_PROVIDERS = ['razorpay'];

const VALID_ENVIRONMENTS = ['sandbox', 'production'];
const VALID_STATUSES = ['pending', 'active', 'inactive'];
const MIN_AMOUNT_PAISE = 100;

const PROVIDER_LABELS = {
  razorpay: 'Razorpay'
};

module.exports = {
  GATEWAY_PROVIDERS,
  VALID_ENVIRONMENTS,
  VALID_STATUSES,
  MIN_AMOUNT_PAISE,
  PROVIDER_LABELS
};
