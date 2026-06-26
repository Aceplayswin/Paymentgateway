const {
  buildScopeFilter,
  getSalesPeriodTotals,
  getMethodMix,
  getTransactionVolume,
  getRevenueOverview
} = require('../../utils/payinAnalytics');

const formatCompactInr = (value) => {
  const numeric = Number(value) || 0;
  if (numeric >= 10000000) {
    return `INR ${(numeric / 10000000).toFixed(2)}Cr`;
  }
  if (numeric >= 100000) {
    return `INR ${(numeric / 100000).toFixed(1)}L`;
  }
  return `INR ${numeric.toLocaleString('en-IN')}`;
};

const REPORT_CENTER_CARDS = [
  { title: 'Transaction Reports', value: 'Ready for CSV/PDF Export' },
  { title: 'Settlement Reports', value: 'Auto-reconciled daily' },
  { title: 'Revenue Reports', value: 'Granular by method and geography' },
  { title: 'Merchant Reports', value: 'KYC + performance coverage' }
];

const getReportCenter = async () => ({
  statusCode: 200,
  success: true,
  message: 'Report center fetched successfully',
  data: {
    cards: REPORT_CENTER_CARDS
  }
});

const getSalesReport = async (user) => {
  const scope = buildScopeFilter(user.role, user.id);
  const [periodTotals, methodMix, transactionVolume] = await Promise.all([
    getSalesPeriodTotals(scope),
    getMethodMix(scope),
    getTransactionVolume(scope)
  ]);

  const upi = methodMix.find((row) => row.name === 'UPI')?.value ?? 0;
  const cards = methodMix.find((row) => row.name === 'Cards')?.value ?? 0;

  return {
    statusCode: 200,
    success: true,
    message: 'Sales report fetched successfully',
    data: {
      cards: [
        { title: 'Daily Sales', value: formatCompactInr(periodTotals.daily) },
        { title: 'Weekly Sales', value: formatCompactInr(periodTotals.weekly) },
        { title: 'Monthly Sales', value: formatCompactInr(periodTotals.monthly) },
        { title: 'Payment Mix', value: `UPI ${upi}% | Cards ${cards}%` }
      ],
      chart: {
        transactionVolume
      }
    }
  };
};

const getMerchantReport = async (user) => {
  const scope = buildScopeFilter(user.role, user.id);
  const revenueOverview = await getRevenueOverview(scope);

  return {
    statusCode: 200,
    success: true,
    message: 'Merchant report fetched successfully',
    data: {
      chart: {
        revenueOverview
      }
    }
  };
};

const getReportsSummary = async (user) => {
  const [center, sales, merchant] = await Promise.all([
    getReportCenter(user),
    getSalesReport(user),
    getMerchantReport(user)
  ]);

  return {
    statusCode: 200,
    success: true,
    message: 'Reports summary fetched successfully',
    data: {
      center: center.data,
      sales: sales.data,
      merchant: merchant.data
    }
  };
};

module.exports = {
  getReportCenter,
  getSalesReport,
  getMerchantReport,
  getReportsSummary
};
