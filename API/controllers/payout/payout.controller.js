const returnResponse = require('../../utils/response');
const payoutService = require('./payout.service');

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

exports.getBalance = handle((req) => payoutService.getPayoutBalance(req.user));
exports.listTransactions = handle((req) => payoutService.listPayoutTransactions(req.user, req.query));
exports.listLedger = handle((req) => payoutService.listLedgerEntries(req.user, req.query));
exports.listIpWhitelist = handle((req) => payoutService.listIpWhitelist(req.user, req.query));
