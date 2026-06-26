const adminService = require('./admin.service');
const returnResponse = require('../../utils/response');

const send = (req, res, result) =>
  returnResponse(req, res, {
    code: result.statusCode,
    success: result.success,
    status: result.success ? 'success' : 'error',
    message: result.message,
    data: result.data ?? null,
  });

exports.getPendingMerchants = async (req, res) => {
  try {
    const result = await adminService.getPendingMerchants();
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};

exports.getApprovedMerchants = async (req, res) => {
  try {
    const result = await adminService.getApprovedMerchants();
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};

exports.getMerchantAccounts = async (req, res) => {
  try {
    const result = await adminService.getMerchantAccounts();
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};

exports.getMerchantApprovalRequests = async (req, res) => {
  try {
    const result = await adminService.getMerchantApprovalRequests(req.query.status);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};

exports.getMerchantApprovalRequest = async (req, res) => {
  try {
    const result = await adminService.getMerchantApprovalRequest(req.params.merchantId);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};

exports.approveMerchant = async (req, res) => {
  try {
    const result = await adminService.approveMerchant(req.params.merchantId, req.user.id);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};

exports.rejectMerchant = async (req, res) => {
  try {
    const result = await adminService.rejectMerchant(
      req.params.merchantId,
      req.user.id,
      req.body.reason
    );
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};
