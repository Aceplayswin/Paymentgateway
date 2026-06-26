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

const capitalizeStatus = (status) => {
  if (!status) {
    return status;
  }
  const normalized = String(status).toLowerCase();
  if (normalized === 'success') {
    return 'Success';
  }
  if (normalized === 'failed') {
    return 'Failed';
  }
  if (normalized === 'pending') {
    return 'Pending';
  }
  if (normalized === 'refunded') {
    return 'Refunded';
  }
  if (normalized === 'processing') {
    return 'Processing';
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getMerchantName = (user) => {
  if (!user) {
    return null;
  }
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
};

const serializePayinTransaction = (transaction) => {
  const user = transaction.user;
  const merchant = getMerchantName(user);

  return {
    transactionId: transaction.transactionId,
    orderId: transaction.orderId,
    customer: transaction.customerName,
    customerName: transaction.customerName,
    customerPhone: transaction.customerPhone || null,
    gatewayProvider: transaction.gatewayProvider || null,
    gatewayOrderId: transaction.gatewayOrderId || null,
    gatewayState: transaction.gatewayState || null,
    merchant,
    amount: formatAmount(transaction.amount),
    amountValue: Number(transaction.amount),
    method: transaction.paymentMethod,
    paymentMethod: transaction.paymentMethod,
    status: capitalizeStatus(transaction.status),
    statusValue: transaction.status,
    timestamp: formatDateTime(transaction.dateTime),
    dateTime: transaction.dateTime,
    userId: transaction.userId,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  };
};

const serializePayoutTransaction = (transaction) => {
  const user = transaction.user;
  const merchant = getMerchantName(user);
  const status =
    transaction.status === 'success' ? 'Processed' : capitalizeStatus(transaction.status);

  return {
    payoutId: transaction.payoutId,
    beneficiaryName: transaction.beneficiaryName,
    bankDetails: transaction.bankDetails,
    merchant,
    amount: formatAmount(transaction.amount),
    amountValue: Number(transaction.amount),
    status,
    statusValue: transaction.status,
    timestamp: formatDateTime(transaction.timestamp),
    dateTime: transaction.timestamp,
    userId: transaction.userId,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  };
};

const generatePayinTransactionId = () =>
  `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

const generatePayoutId = () => `POT${Date.now()}${Math.floor(Math.random() * 1000)}`;

module.exports = {
  serializePayinTransaction,
  serializePayoutTransaction,
  generatePayinTransactionId,
  generatePayoutId
};
