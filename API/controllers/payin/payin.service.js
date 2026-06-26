const pool = require('../../config/db');
const User = require('../../models/user.model');
const MerchantKyc = require('../../models/merchantKyc.model');
const PayinTransaction = require('../../models/payinTransaction.model');
const Settlement = require('../../models/settlement.model');
const Dispute = require('../../models/dispute.model');
const { formatAmount } = require('../../utils/formatters');
const {
  serializeSettlement,
  serializeComplaint,
  serializeRefundCallback,
  serializeChargebackDispute,
  serializePayinTableRow
} = require('../../utils/dashboardSerializers');
const { mapKycStatusForClient, mapAccountStatus } = require('../shared/user.serializer');
const {
  buildScopeFilter,
  getPayinStats,
  getMethodMix,
  getSuccessFailure,
  getSettledTotal
} = require('../../utils/payinAnalytics');
const reportsService = require('../reports/reports.service');

const formatCompactInr = (value) => {
  const numeric = Number(value) || 0;
  if (numeric >= 10000000) {
    return `INR ${(numeric / 10000000).toFixed(2)}Cr`;
  }
  if (numeric >= 100000) {
    return `INR ${(numeric / 100000).toFixed(1)}L`;
  }
  return formatAmount(numeric);
};

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildUserFilter = (user, queryUserId) => {
  if (user.role === 'merchant') {
    return user.id;
  }
  if (queryUserId) {
    return parseInt(queryUserId, 10);
  }
  return undefined;
};

const getPayinSummary = async (user) => {
  const scope = buildScopeFilter(user.role, user.id);
  const stats = await getPayinStats(scope);
  const [successFailure, settledTotal] = await Promise.all([
    getSuccessFailure(scope),
    getSettledTotal(scope)
  ]);

  const successRate = successFailure.find((row) => row.name === 'Success')?.value ?? 0;
  const avgTicket = stats.successCount > 0 ? stats.monthTotal / stats.successCount : 0;

  return {
    statusCode: 200,
    success: true,
    message: 'Payin summary fetched successfully',
    data: {
      cards: [
        { title: 'Payment Success Rate', value: `${successRate}%` },
        { title: 'Revenue Snapshot', value: formatCompactInr(stats.monthTotal) },
        { title: 'Settlement Snapshot', value: `${formatCompactInr(settledTotal)} Settled` },
        { title: 'Volume Analytics', value: `${stats.totalCount.toLocaleString('en-IN')} Txns` },
        { title: 'Quick Stats', value: `Avg Ticket ${formatCompactInr(avgTicket)}` }
      ]
    }
  };
};

const getSalesReport = reportsService.getSalesReport;
const getMerchantReport = reportsService.getMerchantReport;
const getReportCenter = reportsService.getReportCenter;

const listRefundCallbacks = async (user, query) => {
  const { page, limit, offset } = parsePagination(query);
  const userId = buildUserFilter(user, query.userId);

  const { rows, count } = await PayinTransaction.listAndCount({
    userId,
    status: 'refunded',
    search: query.search,
    limit,
    offset
  });

  return {
    statusCode: 200,
    success: true,
    message: 'Refund callbacks fetched successfully',
    data: rows.map(serializeRefundCallback),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit) || 1
    }
  };
};

const listChargebacksLiens = async (user, query) => {
  const { page, limit, offset } = parsePagination(query);
  const userId = buildUserFilter(user, query.userId);

  const whereClauses = ["d.type IN ('chargeback', 'lien')"];
  const values = [];

  if (userId !== undefined) {
    whereClauses.push('pt.user_id = ?');
    values.push(userId);
  }

  if (query.status) {
    whereClauses.push('d.status = ?');
    values.push(String(query.status).toLowerCase());
  }

  if (query.search) {
    const term = `%${query.search}%`;
    whereClauses.push('(d.dispute_id LIKE ? OR d.reason LIKE ? OR d.transaction_id LIKE ?)');
    values.push(term, term, term);
  }

  const whereStr = `WHERE ${whereClauses.join(' AND ')}`;
  const countSql = `SELECT COUNT(*) AS total FROM disputes d
    LEFT JOIN payin_transactions pt ON d.transaction_id = pt.transaction_id ${whereStr}`;
  const dataSql = `SELECT d.*, pt.user_id AS txn_user_id,
    u.id AS u_id, u.username AS u_username, u.first_name AS u_first_name,
    u.last_name AS u_last_name, u.email AS u_email
    FROM disputes d
    LEFT JOIN payin_transactions pt ON d.transaction_id = pt.transaction_id
    LEFT JOIN users u ON pt.user_id = u.id
    ${whereStr}
    ORDER BY d.created_at DESC LIMIT ? OFFSET ?`;

  const [[countRows], [rows]] = await Promise.all([
    pool.query(countSql, values),
    pool.query(dataSql, [...values, limit, offset])
  ]);

  const disputes = rows.map((row) =>
    serializeChargebackDispute({
      disputeId: row.dispute_id,
      transactionId: row.transaction_id,
      type: row.type,
      reason: row.reason,
      status: row.status,
      resolutionNotes: row.resolution_notes
    })
  );

  return {
    statusCode: 200,
    success: true,
    message: 'Chargebacks and liens fetched successfully',
    data: disputes,
    pagination: {
      page,
      limit,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limit) || 1
    }
  };
};

const listComplaints = async (user, query) => {
  const { page, limit, offset } = parsePagination(query);
  const userId = buildUserFilter(user, query.userId);

  const { rows, count } = await Dispute.listAndCount({
    userId,
    type: 'complaint',
    status: query.status,
    search: query.search,
    limit,
    offset
  });

  return {
    statusCode: 200,
    success: true,
    message: 'Complaints fetched successfully',
    data: rows.map(serializeComplaint),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit) || 1
    }
  };
};

const listPayinTransactions = async (user, query) => {
  const { page, limit, offset } = parsePagination(query);
  const userId = buildUserFilter(user, query.userId);

  const { rows, count } = await PayinTransaction.listAndCount({
    userId,
    status: query.status,
    search: query.search,
    limit,
    offset
  });

  return {
    statusCode: 200,
    success: true,
    message: 'Payin transactions fetched successfully',
    data: rows.map(serializePayinTableRow),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit) || 1
    }
  };
};

const listSettlements = async (user, query) => {
  const { page, limit, offset } = parsePagination(query);
  const userId = buildUserFilter(user, query.userId);

  const { rows, count } = await Settlement.listAndCount({
    userId,
    status: query.status,
    search: query.search,
    limit,
    offset
  });

  return {
    statusCode: 200,
    success: true,
    message: 'Settlements fetched successfully',
    data: rows.map(serializeSettlement),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit) || 1
    }
  };
};

const getMerchantManagerRows = async () => {
  const merchants = await User.findMerchants('approved');
  const rows = await Promise.all(
    merchants.map(async (merchant) => {
      const kyc = await MerchantKyc.findByUserId(merchant.id);
      const businessType = kyc?.formData?.business?.businessType || '—';
      const kycClientStatus = mapKycStatusForClient(merchant.kycStatus);
      let kycStatusLabel = 'Pending';
      if (kycClientStatus === 'submitted') kycStatusLabel = 'Under Review';
      if (kycClientStatus === 'approved') kycStatusLabel = 'Verified';

      const merchantStatus =
        mapAccountStatus(merchant.approvalStatus) === 'approved' && kycClientStatus === 'approved'
          ? 'Active'
          : 'Under Review';

      const [volumeRow] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM payin_transactions
         WHERE user_id = ? AND status = 'success'`,
        [merchant.id]
      );
      const volume = Number(volumeRow[0]?.total || 0);

      return {
        merchantId: `MRC${merchant.id}`,
        merchantName: `${merchant.firstName || ''} ${merchant.lastName || ''}`.trim() || merchant.email,
        businessType,
        kycStatus: kycStatusLabel,
        transactionVolume: formatCompactInr(volume),
        merchantStatus,
        email: merchant.email
      };
    })
  );

  return { statusCode: 200, success: true, data: { count: rows.length, merchants: rows } };
};

module.exports = {
  getPayinSummary,
  getSalesReport,
  getMerchantReport,
  getReportCenter,
  listRefundCallbacks,
  listChargebacksLiens,
  listComplaints,
  listPayinTransactions,
  listSettlements,
  getMerchantManagerRows
};
