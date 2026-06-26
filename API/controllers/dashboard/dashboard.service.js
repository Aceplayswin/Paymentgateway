const PayinTransaction = require('../../models/payinTransaction.model');
const PayoutBalance = require('../../models/payoutBalance.model');
const { formatAmount } = require('../../utils/formatters');
const { serializePayinTableRow } = require('../../utils/dashboardSerializers');
const {
  buildScopeFilter,
  getPayinStats,
  getMethodMix,
  getSuccessFailure,
  getMonthlyRevenue,
  getRevenueOverview,
  getTransactionVolume,
  getSettlementTrend,
  getAdminPlatformStats,
  scaleAdminCharts
} = require('../../utils/payinAnalytics');

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

const buildStatCard = (title, value, currentValue, previousValue) => {
  const current = Number(currentValue) || 0;
  const previous = Number(previousValue) || 0;
  const base = previous === 0 ? 1 : Math.abs(previous);
  const trendValue = ((current - previous) / base) * 100;
  const roundedTrend = Math.round(trendValue * 10) / 10;

  return {
    title,
    value,
    trend: `${roundedTrend >= 0 ? '+' : ''}${roundedTrend}%`,
    direction: roundedTrend >= 0 ? 'up' : 'down'
  };
};

const buildMerchantStats = (stats, balance) => {
  const available = balance?.availableBalance ?? 0;
  const pending = balance?.pendingAmount ?? stats.pendingSettlements;
  const settlementRate =
    stats.totalCount > 0
      ? Math.round((stats.successCount / stats.totalCount) * 1000) / 10
      : 0;

  return [
    buildStatCard(
      "Today's Collection",
      formatCompactInr(stats.todayTotal),
      stats.todayTotal,
      stats.yesterdayTotal
    ),
    buildStatCard(
      'Monthly Revenue',
      formatCompactInr(stats.monthTotal),
      stats.monthTotal,
      stats.prevMonthTotal
    ),
    buildStatCard(
      'Successful Payments',
      stats.successCount.toLocaleString('en-IN'),
      stats.recentSuccessCount,
      stats.prevPeriodSuccessCount
    ),
    buildStatCard(
      'Failed Payments',
      stats.failedCount.toLocaleString('en-IN'),
      stats.recentFailedCount,
      stats.prevPeriodFailedCount
    ),
    buildStatCard(
      'Pending Settlements',
      formatCompactInr(pending),
      stats.pendingSettlements,
      stats.prevPendingSettlements
    ),
    buildStatCard(
      'Available Balance',
      formatCompactInr(available),
      stats.recentSettledAmount,
      stats.prevSettledAmount
    ),
    buildStatCard(
      'Refund Requests',
      String(stats.refundCount),
      stats.recentRefundCount,
      stats.prevRefundCount
    ),
    buildStatCard(
      'Settlement Success Rate',
      `${settlementRate}%`,
      stats.recentSettlementRate,
      stats.prevSettlementRate
    )
  ];
};

const buildAdminStats = (stats, platform) => [
  buildStatCard(
    "Today's Collection",
    formatCompactInr(stats.todayTotal),
    stats.todayTotal,
    stats.yesterdayTotal
  ),
  buildStatCard(
    'Monthly Revenue',
    formatCompactInr(stats.monthTotal),
    stats.monthTotal,
    stats.prevMonthTotal
  ),
  buildStatCard(
    'Successful Payments',
    stats.successCount.toLocaleString('en-IN'),
    stats.recentSuccessCount,
    stats.prevPeriodSuccessCount
  ),
  buildStatCard(
    'Failed Payments',
    stats.failedCount.toLocaleString('en-IN'),
    stats.recentFailedCount,
    stats.prevPeriodFailedCount
  ),
  buildStatCard(
    'Active Merchants',
    String(platform.activeMerchants),
    platform.recentActiveMerchants,
    platform.prevActiveMerchants
  ),
  buildStatCard(
    'System SLA',
    `${platform.systemSla.toFixed(2)}%`,
    platform.systemSla,
    platform.prevSystemSla
  ),
  buildStatCard(
    'Open Complaints',
    String(platform.openComplaints),
    platform.openComplaints,
    platform.prevOpenComplaints
  )
];

const getDashboardSummary = async (user) => {
  const isAdmin = user.role === 'admin';
  const scope = buildScopeFilter(user.role, user.id);
  const stats = await getPayinStats(scope);

  const payinFilter = {};
  if (!isAdmin) payinFilter.userId = user.id;

  const [
    balance,
    platformStats,
    revenueOverview,
    transactionVolume,
    methodMix,
    successFailure,
    settlementTrend,
    monthlyRevenue,
    { rows: recentRows }
  ] = await Promise.all([
    isAdmin ? null : PayoutBalance.findByUserId(user.id),
    isAdmin ? getAdminPlatformStats() : null,
    getRevenueOverview(scope),
    getTransactionVolume(scope),
    getMethodMix(scope),
    getSuccessFailure(scope),
    getSettlementTrend(scope),
    getMonthlyRevenue(scope),
    PayinTransaction.listAndCount({ ...payinFilter, limit: 10, offset: 0 })
  ]);

  const charts = {
    revenueOverview,
    transactionVolume,
    methodMix,
    successFailure,
    settlementTrend,
    monthlyRevenue
  };

  return {
    statusCode: 200,
    success: true,
    message: 'Dashboard summary fetched successfully',
    data: {
      stats: isAdmin ? buildAdminStats(stats, platformStats) : buildMerchantStats(stats, balance),
      charts: isAdmin ? scaleAdminCharts(charts) : charts,
      recentTransactions: recentRows.map(serializePayinTableRow)
    }
  };
};

module.exports = { getDashboardSummary };
