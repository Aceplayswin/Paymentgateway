const path = require('path');
const kycService = require('./kyc.service');
const returnResponse = require('../../utils/response');

const send = (req, res, result) =>
  returnResponse(req, res, {
    code: result.statusCode,
    success: result.success,
    status: result.success ? 'success' : 'error',
    message: result.message,
    data: result.data ?? null
  });

exports.getStatus = async (req, res) => {
  try {
    const result = await kycService.getMerchantKycStatus(req.user.id);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: error.message
    });
  }
};

exports.saveDraft = async (req, res) => {
  try {
    const result = await kycService.saveMerchantKycDraft(req.user.id, req.body);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: error.message
    });
  }
};

exports.submit = async (req, res) => {
  try {
    const result = await kycService.submitMerchantKyc(req.user.id, req.body);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: error.message
    });
  }
};

exports.getSubmittedRequests = async (req, res) => {
  try {
    const result = await kycService.getSubmittedKycRequests();
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: error.message
    });
  }
};

exports.getMerchantKyc = async (req, res) => {
  try {
    const result = await kycService.getMerchantKycById(req.params.merchantId);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: error.message
    });
  }
};

exports.approve = async (req, res) => {
  try {
    const result = await kycService.approveMerchantKyc(req.params.merchantId, req.user.id);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: error.message
    });
  }
};

exports.reject = async (req, res) => {
  try {
    const result = await kycService.rejectMerchantKyc(
      req.params.merchantId,
      req.user.id,
      req.body.reason
    );
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: error.message
    });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const storagePath = req.params.storagePath;
    const result = await kycService.getKycDocument(req.user, storagePath);

    if (!result.success) {
      return send(req, res, result);
    }

    const absolutePath = result.data.absolutePath;
    const buffer = result.data.buffer;

    return res
      .status(200)
      .type(path.extname(absolutePath).slice(1) || 'octet-stream')
      .send(buffer);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: error.message
    });
  }
};
