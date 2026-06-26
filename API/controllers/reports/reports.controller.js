const reportsService = require('./reports.service');

const handle = (handler) => async (req, res) => {
  try {
    const result = await handler(req);
    const payload = {
      code: result.statusCode,
      success: result.success,
      status: result.success ? 'success' : 'error',
      message: result.message,
      data: result.data ?? null,
      timestamp: Math.floor(Date.now() / 1000),
      method: req.method,
      endpoint: req.originalUrl
    };

    if (result.pagination) {
      payload.pagination = result.pagination;
    }

    return res.status(result.statusCode).json(payload);
  } catch (error) {
    return res.status(500).json({
      code: 500,
      success: false,
      status: 'error',
      message: error.message,
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
      method: req.method,
      endpoint: req.originalUrl
    });
  }
};

exports.getCenter = handle((req) => reportsService.getReportCenter(req.user));
exports.getSales = handle((req) => reportsService.getSalesReport(req.user));
exports.getMerchant = handle((req) => reportsService.getMerchantReport(req.user));
exports.getSummary = handle((req) => reportsService.getReportsSummary(req.user));
