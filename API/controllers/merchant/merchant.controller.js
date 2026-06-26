const merchantService = require('./merchant.service');
const returnResponse = require('../../utils/response');

const send = (req, res, result) =>
  returnResponse(req, res, {
    code: result.statusCode,
    success: result.success,
    status: result.success ? 'success' : 'error',
    message: result.message,
    data: result.data ?? null,
  });

exports.submitMerchantApprovalRequest = async (req, res) => {
  try {
    const result = await merchantService.submitApprovalRequest(req.body);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};

exports.getMerchantApprovalStatus = async (req, res) => {
  try {
    const result = await merchantService.getApprovalStatus(req.body);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};
