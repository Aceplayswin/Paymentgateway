const returnResponse = require('../../utils/response');
const dashboardService = require('./dashboard.service');
const payinService = require('../payin/payin.service');

const send = (req, res, result) =>
  returnResponse(req, res, {
    code: result.statusCode,
    success: result.success,
    status: result.success ? 'success' : 'error',
    message: result.message || 'Success',
    data: result.data ?? null
  });

exports.getSummary = async (req, res) => {
  try {
    const result = await dashboardService.getDashboardSummary(req.user);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};

exports.getMerchantManager = async (req, res) => {
  try {
    const result = await payinService.getMerchantManagerRows();
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};
