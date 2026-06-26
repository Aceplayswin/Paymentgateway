const returnResponse = require('../../utils/response');
const payinService = require('./payin.service');

const send = (req, res, result) =>
  returnResponse(req, res, {
    code: result.statusCode,
    success: result.success,
    status: result.success ? 'success' : 'error',
    message: result.message || 'Success',
    data: result.data ?? null,
    pagination: result.pagination
  });

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
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: error.message
    });
  }
};

exports.getSummary = handle((req) => payinService.getPayinSummary(req.user));
exports.getSalesReport = handle((req) => payinService.getSalesReport(req.user));
exports.getMerchantReport = handle((req) => payinService.getMerchantReport(req.user));
exports.getReports = handle((req) => payinService.getReportCenter(req.user));
exports.listRefundCallbacks = handle((req) => payinService.listRefundCallbacks(req.user, req.query));
exports.listChargebacksLiens = handle((req) => payinService.listChargebacksLiens(req.user, req.query));
exports.listComplaints = handle((req) => payinService.listComplaints(req.user, req.query));
exports.listTransactions = handle((req) => payinService.listPayinTransactions(req.user, req.query));
exports.listSettlements = handle((req) => payinService.listSettlements(req.user, req.query));
