const {
  formatAmount,
  formatDate,
  formatDateTime,
  getMerchantName,
  capitalizeStatus
} = require('./formatters');
const { normalizeMethodLabel } = require('./payinAnalytics');
const { serializePayinTransaction, serializePayoutTransaction } = require('./transactionFormat');

const computeGst = (fees) => {
  const numeric = Number(fees) || 0;
  return Math.round(numeric * 0.18 * 100) / 100;
};

const serializeSettlement = (settlement) => {
  const fees = Number(settlement.fees) || 0;
  const gst = computeGst(fees);
  const gross = Number(settlement.totalAmount) || 0;
  const net =
    settlement.netAmount != null ? Number(settlement.netAmount) : Math.max(0, gross - fees - gst);

  return {
    settlementId: settlement.settlementId,
    grossAmount: formatAmount(gross),
    fees: formatAmount(fees),
    gst: formatAmount(gst),
    netSettlement: formatAmount(net),
    settlementStatus: capitalizeStatus(settlement.settlementStatus),
    settlementStatusValue: settlement.settlementStatus,
    settlementDate: formatDate(settlement.settlementDate),
    merchant: getMerchantName(settlement.user),
    userId: settlement.userId,
    createdAt: settlement.createdAt,
    updatedAt: settlement.updatedAt
  };
};

const serializeLedgerEntry = (entry) => {
  const type = String(entry.debitCredit || '').toLowerCase() === 'credit' ? 'Credit' : 'Debit';

  return {
    entryId: entry.entryId,
    type,
    balance: formatAmount(entry.balance),
    referenceId: entry.referenceId,
    timestamp: formatDateTime(entry.timestamp),
    merchant: getMerchantName(entry.user),
    userId: entry.userId,
    amountValue: Number(entry.amount)
  };
};

const formatTimeline = (createdAt, isResolved = false) => {
  if (!createdAt) {
    return '—';
  }
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const prefix = isResolved ? 'Resolved' : 'Raised';
  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${prefix} ${minutes}m ago`;
  }
  if (hours < 24) {
    return `${prefix} ${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${prefix} ${days}d ago`;
};

const derivePriority = (reason = '') => {
  const text = String(reason).toLowerCase();
  if (text.includes('api') || text.includes('critical')) return 'Critical';
  if (text.includes('chargeback') || text.includes('delay')) return 'High';
  if (text.includes('refund')) return 'Medium';
  return 'Low';
};

const serializeDispute = (dispute) => ({
  disputeId: dispute.disputeId,
  transactionId: dispute.transactionId,
  reason: dispute.reason,
  status: capitalizeStatus(dispute.status),
  priority: derivePriority(dispute.reason),
  notes: dispute.resolutionNotes || '—'
});

const serializeComplaint = (dispute) => {
  const statusLabel =
    dispute.status === 'resolved'
      ? 'Closed'
      : dispute.status === 'under_review'
        ? 'Investigating'
        : capitalizeStatus(dispute.status);

  const timeline =
    dispute.status === 'resolved'
      ? formatTimeline(dispute.updatedAt || dispute.createdAt, true)
      : formatTimeline(dispute.createdAt, false);

  return {
    complaintId: dispute.disputeId,
    merchant: getMerchantName(dispute.user),
    issueType: dispute.reason,
    priority: derivePriority(dispute.reason),
    status: statusLabel,
    timeline,
    transactionId: dispute.transactionId,
    type: dispute.type,
    userId: dispute.userId,
    createdAt: dispute.createdAt
  };
};

const serializeIpWhitelistEntry = (entry) => ({
  id: entry.id,
  ip: entry.allowedIpAddress,
  status: entry.status === 'active' ? 'Enabled' : 'Disabled',
  statusValue: entry.status,
  addedDate: formatDate(entry.addedDate),
  userId: entry.userId
});


const serializePayoutTableRow = (transaction) => {
  const row = serializePayoutTransaction(transaction);
  return {
    payoutId: row.payoutId,
    beneficiaryName: row.beneficiaryName,
    bankDetails: row.bankDetails,
    merchant: row.merchant,
    amount: row.amount,
    status: row.status,
    timestamp: row.timestamp
  };
};

const serializeLedgerTableRow = (entry) => {
  const row = serializeLedgerEntry(entry);
  return {
    entryId: row.entryId,
    type: row.type,
    balance: row.balance,
    referenceId: row.referenceId,
    timestamp: row.timestamp,
    merchant: row.merchant
  };
};

const serializeIpWhitelistTableRow = (entry) => ({
  ip: entry.ip,
  status: entry.status,
  addedDate: entry.addedDate
});


const serializePayinTableRow = (transaction) => {
  const row = serializePayinTransaction(transaction);

  return {
    transactionId: row.transactionId,
    orderId: row.orderId,
    customer: row.customer,
    merchant: row.merchant,
    amount: row.amount,
    method: normalizeMethodLabel(row.method),
    status: row.status,
    timestamp: row.timestamp
  };
};

const serializeRefundCallback = (transaction) => {
  const row = serializePayinTableRow(transaction);
  const numeric = Number(String(row.amount).replace(/[^\d.]/g, '')) || 0;

  return {
    refundId: `RFD${row.transactionId.replace(/^TXN/, '')}`,
    callbackId: `CBK${String(transaction.orderId || row.orderId || '').replace(/^ORD/, '')}`,
    amount: row.amount,
    status: row.status === 'Refunded' ? 'Success' : row.status,
    timestamp: row.timestamp,
    transactionId: row.transactionId,
    amountValue: numeric
  };
};

const serializeChargebackDispute = (dispute) => {
  const statusLabel =
    dispute.status === 'resolved'
      ? 'Resolved'
      : dispute.status === 'under_review'
        ? 'Investigating'
        : capitalizeStatus(dispute.status);

  return {
    disputeId: dispute.disputeId,
    transactionId: dispute.transactionId,
    reason: dispute.reason,
    status: statusLabel,
    priority: derivePriority(dispute.reason),
    notes: dispute.resolutionNotes || 'Awaiting merchant evidence upload'
  };
};

module.exports = {
  serializeSettlement,
  serializeLedgerEntry,
  serializeDispute,
  serializeComplaint,
  serializeIpWhitelistEntry,
  serializePayinTableRow,
  serializeRefundCallback,
  serializeChargebackDispute,
  serializePayoutTableRow,
  serializeLedgerTableRow,
  serializeIpWhitelistTableRow,
  computeGst
};
