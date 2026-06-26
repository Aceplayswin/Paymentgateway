const formatAmount = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }
  return `INR ${numeric.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

const formatDate = (value) => {
  if (!value) {
    return null;
  }
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = (value) => {
  if (!value) {
    return null;
  }
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getMerchantName = (user) => {
  if (!user) {
    return null;
  }
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
};

const capitalizeStatus = (status) => {
  if (!status) {
    return status;
  }
  const normalized = String(status).toLowerCase();
  const labels = {
    success: 'Success',
    failed: 'Failed',
    pending: 'Pending',
    refunded: 'Refunded',
    processing: 'Processing',
    settled: 'Settled',
    open: 'Open',
    under_review: 'Investigating',
    resolved: 'Closed',
    rejected: 'Rejected',
    active: 'Enabled',
    inactive: 'Disabled'
  };
  return labels[normalized] || status.charAt(0).toUpperCase() + status.slice(1);
};

module.exports = {
  formatAmount,
  formatDate,
  formatDateTime,
  getMerchantName,
  capitalizeStatus
};
