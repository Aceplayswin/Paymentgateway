const pool = require('../config/db');

const ADMIN_REVENUE_SCALE = 2.4;
const ADMIN_VOLUME_SCALE = 3.2;

const buildScopeFilter = (role, userId) => {
  if (role === 'merchant') {
    return { sql: 'AND user_id = ?', values: [userId] };
  }
  return { sql: '', values: [] };
};

const queryScalar = async (sql, values) => {
  const [rows] = await pool.query(sql, values);
  return Number(rows[0]?.total || 0);
};

const getPayinStats = async (scope) => {
  const base = `FROM payin_transactions WHERE 1=1 ${scope.sql}`;
  const values = [...scope.values];
  const settlementBase = `FROM settlements WHERE 1=1 ${scope.sql}`;

  const [
    todayTotal,
    yesterdayTotal,
    monthTotal,
    prevMonthTotal,
    successCount,
    failedCount,
    recentSuccessCount,
    prevPeriodSuccessCount,
    recentFailedCount,
    prevPeriodFailedCount,
    pendingSettlements,
    prevPendingSettlements,
    refundCount,
    recentRefundCount,
    prevRefundCount,
    totalCount,
    recentTotalCount,
    prevPeriodTotalCount,
    recentSuccessForRate,
    prevSuccessForRate,
    recentSettledAmount,
    prevSettledAmount
  ] = await Promise.all([
    queryScalar(
      `SELECT COALESCE(SUM(amount), 0) AS total ${base} AND status = 'success' AND DATE(date_time) = CURDATE()`,
      values
    ),
    queryScalar(
      `SELECT COALESCE(SUM(amount), 0) AS total ${base} AND status = 'success' AND DATE(date_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COALESCE(SUM(amount), 0) AS total ${base} AND status = 'success' AND date_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COALESCE(SUM(amount), 0) AS total ${base} AND status = 'success' AND date_time >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND date_time < DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      values
    ),
    queryScalar(`SELECT COUNT(*) AS total ${base} AND status = 'success'`, values),
    queryScalar(`SELECT COUNT(*) AS total ${base} AND status = 'failed'`, values),
    queryScalar(
      `SELECT COUNT(*) AS total ${base} AND status = 'success' AND date_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COUNT(*) AS total ${base} AND status = 'success' AND date_time >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND date_time < DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COUNT(*) AS total ${base} AND status = 'failed' AND date_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COUNT(*) AS total ${base} AND status = 'failed' AND date_time >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND date_time < DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COALESCE(SUM(net_amount), 0) AS total ${settlementBase} AND settlement_status IN ('pending', 'processing')`,
      values
    ),
    queryScalar(
      `SELECT COALESCE(SUM(net_amount), 0) AS total ${settlementBase} AND settlement_status IN ('pending', 'processing') AND settlement_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND settlement_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      values
    ),
    queryScalar(`SELECT COUNT(*) AS total ${base} AND status = 'refunded'`, values),
    queryScalar(
      `SELECT COUNT(*) AS total ${base} AND status = 'refunded' AND date_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COUNT(*) AS total ${base} AND status = 'refunded' AND date_time >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND date_time < DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      values
    ),
    queryScalar(`SELECT COUNT(*) AS total ${base}`, values),
    queryScalar(
      `SELECT COUNT(*) AS total ${base} AND date_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COUNT(*) AS total ${base} AND date_time >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND date_time < DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COUNT(*) AS total ${base} AND status = 'success' AND date_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COUNT(*) AS total ${base} AND status = 'success' AND date_time >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND date_time < DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COALESCE(SUM(net_amount), 0) AS total ${settlementBase} AND settlement_status = 'settled' AND settlement_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COALESCE(SUM(net_amount), 0) AS total ${settlementBase} AND settlement_status = 'settled' AND settlement_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND settlement_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      values
    )
  ]);

  const recentSettlementRate =
    recentTotalCount > 0 ? Math.round((recentSuccessForRate / recentTotalCount) * 1000) / 10 : 0;
  const prevSettlementRate =
    prevPeriodTotalCount > 0 ? Math.round((prevSuccessForRate / prevPeriodTotalCount) * 1000) / 10 : 0;

  return {
    todayTotal,
    yesterdayTotal,
    monthTotal,
    prevMonthTotal,
    successCount,
    failedCount,
    recentSuccessCount,
    prevPeriodSuccessCount,
    recentFailedCount,
    prevPeriodFailedCount,
    pendingSettlements,
    prevPendingSettlements,
    refundCount,
    recentRefundCount,
    prevRefundCount,
    totalCount,
    recentSettlementRate,
    prevSettlementRate,
    recentSettledAmount,
    prevSettledAmount
  };
};

const normalizeMethodLabel = (method) => {
  const value = String(method || '').trim();
  if (value.toLowerCase() === 'card') return 'Cards';
  return value;
};

const normalizeMethodMix = (rows) => {
  const bucket = new Map();

  rows.forEach((row) => {
    const name = normalizeMethodLabel(row.name);
    bucket.set(name, (bucket.get(name) || 0) + Number(row.value || 0));
  });

  return Array.from(bucket.entries()).map(([name, value]) => ({ name, value }));
};

const getMethodMix = async (scope) => {
  const [rows] = await pool.query(
    `SELECT payment_method AS method, COUNT(*) AS count
     FROM payin_transactions WHERE status = 'success' ${scope.sql}
     GROUP BY payment_method ORDER BY count DESC`,
    scope.values
  );
  const total = rows.reduce((sum, row) => sum + Number(row.count), 0) || 1;
  return normalizeMethodMix(
    rows.map((row) => ({
      name: row.method,
      value: Math.round((Number(row.count) / total) * 100)
    }))
  );
};

const getSuccessFailure = async (scope) => {
  const success = await queryScalar(
    `SELECT COUNT(*) AS total FROM payin_transactions WHERE status = 'success' ${scope.sql}`,
    scope.values
  );
  const failed = await queryScalar(
    `SELECT COUNT(*) AS total FROM payin_transactions WHERE status = 'failed' ${scope.sql}`,
    scope.values
  );
  const total = success + failed || 1;
  return [
    { name: 'Success', value: Math.round((success / total) * 1000) / 10 },
    { name: 'Failed', value: Math.round((failed / total) * 1000) / 10 }
  ];
};

const BULK_TXN_FILTER = "AND pt.transaction_id NOT LIKE 'BULK%'";

const getMonthlyRevenue = async (scope) => {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(date_time, '%b') AS month,
            MONTH(date_time) AS month_num,
            COALESCE(SUM(amount), 0) AS amount
     FROM payin_transactions
     WHERE status = 'success'
       AND date_time >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       AND transaction_id NOT LIKE 'BULK%' ${scope.sql}
     GROUP BY MONTH(date_time), DATE_FORMAT(date_time, '%b')
     ORDER BY month_num`,
    scope.values
  );
  return rows.map((row) => ({ month: row.month, amount: Number(row.amount) }));
};

const getRevenueOverview = async (scope) => {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(pt.date_time, '%b') AS name,
            MONTH(pt.date_time) AS month_num,
            COALESCE(SUM(pt.amount), 0) AS revenue,
            COALESCE(SUM(s.net_amount), 0) AS settlements
     FROM payin_transactions pt
     LEFT JOIN settlements s ON s.user_id = pt.user_id
       AND DATE(s.settlement_date) = DATE(pt.date_time)
     WHERE pt.status = 'success'
       AND pt.date_time >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       ${BULK_TXN_FILTER} ${scope.sql.replace('user_id', 'pt.user_id')}
     GROUP BY MONTH(pt.date_time), DATE_FORMAT(pt.date_time, '%b')
     ORDER BY month_num`,
    scope.values
  );
  return rows.map((row) => ({
    name: row.name,
    revenue: Number(row.revenue),
    settlements: Number(row.settlements)
  }));
};

const getTransactionVolume = async (scope) => {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(date_time, '%a') AS day,
            DAYOFWEEK(date_time) AS dow,
            COUNT(*) AS volume
     FROM payin_transactions
     WHERE date_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${scope.sql}
     GROUP BY DAYOFWEEK(date_time), DATE_FORMAT(date_time, '%a')
     ORDER BY dow`,
    scope.values
  );
  return rows.map((row) => ({ day: row.day, volume: Number(row.volume) }));
};

const getSettlementTrend = async (scope) => {
  const [rows] = await pool.query(
    `SELECT CONCAT('W', WEEK(settlement_date, 1) - WEEK(DATE_SUB(CURDATE(), INTERVAL 4 WEEK), 1) + 1) AS name,
            SUM(CASE WHEN settlement_status = 'settled' THEN 1 ELSE 0 END) AS settled,
            SUM(CASE WHEN settlement_status IN ('failed', 'pending') THEN 1 ELSE 0 END) AS delayed_count
     FROM settlements
     WHERE settlement_date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK) ${scope.sql}
     GROUP BY WEEK(settlement_date, 1)
     ORDER BY WEEK(settlement_date, 1)
     LIMIT 4`,
    scope.values
  );
  return rows.map((row) => ({
    name: row.name || 'W1',
    settled: Number(row.settled),
    delayed: Number(row.delayed_count)
  }));
};

const getAdminPlatformStats = async () => {
  const [activeMerchants, openComplaints, successCount, failedCount] = await Promise.all([
    queryScalar(
      `SELECT COUNT(*) AS total FROM users
       WHERE role = 'merchant' AND approval_status = 'approved' AND kyc_status = 'verified'`,
      []
    ),
    queryScalar(
      `SELECT COUNT(*) AS total FROM disputes
       WHERE type = 'complaint' AND status IN ('open', 'under_review')`,
      []
    ),
    queryScalar(`SELECT COUNT(*) AS total FROM payin_transactions WHERE status = 'success'`, []),
    queryScalar(`SELECT COUNT(*) AS total FROM payin_transactions WHERE status = 'failed'`, [])
  ]);

  const total = successCount + failedCount || 1;
  const systemSla = Math.round((successCount / total) * 10000) / 100;

  return { activeMerchants, openComplaints, systemSla };
};

const getSalesPeriodTotals = async (scope) => {
  const base = `FROM payin_transactions WHERE status = 'success' ${scope.sql}`;
  const values = [...scope.values];

  const [daily, weekly, monthly] = await Promise.all([
    queryScalar(
      `SELECT COALESCE(SUM(amount), 0) AS total ${base} AND DATE(date_time) = CURDATE()`,
      values
    ),
    queryScalar(
      `SELECT COALESCE(SUM(amount), 0) AS total ${base} AND date_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      values
    ),
    queryScalar(
      `SELECT COALESCE(SUM(amount), 0) AS total ${base} AND date_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      values
    )
  ]);

  return { daily, weekly, monthly };
};

const getSettledTotal = async (scope) => {
  return queryScalar(
    `SELECT COALESCE(SUM(net_amount), 0) AS total FROM settlements WHERE settlement_status = 'settled' ${scope.sql}`,
    scope.values
  );
};

const scaleAdminCharts = (charts) => ({
  revenueOverview: charts.revenueOverview.map((row) => ({
    ...row,
    revenue: Math.round(row.revenue * ADMIN_REVENUE_SCALE),
    settlements: Math.round(row.settlements * ADMIN_REVENUE_SCALE)
  })),
  transactionVolume: charts.transactionVolume.map((row) => ({
    ...row,
    volume: Math.round(row.volume * ADMIN_VOLUME_SCALE)
  })),
  methodMix: charts.methodMix,
  successFailure: charts.successFailure,
  settlementTrend: charts.settlementTrend,
  monthlyRevenue: charts.monthlyRevenue.map((row) => ({
    ...row,
    amount: Math.round(row.amount * ADMIN_REVENUE_SCALE)
  }))
});

module.exports = {
  ADMIN_REVENUE_SCALE,
  ADMIN_VOLUME_SCALE,
  buildScopeFilter,
  queryScalar,
  getPayinStats,
  getMethodMix,
  getSuccessFailure,
  getMonthlyRevenue,
  getRevenueOverview,
  getTransactionVolume,
  getSettlementTrend,
  getAdminPlatformStats,
  getSalesPeriodTotals,
  getSettledTotal,
  scaleAdminCharts,
  normalizeMethodLabel
};
