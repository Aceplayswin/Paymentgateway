const returnResponse = require('../../utils/response');
const profileService = require('./profile.service');

const send = (req, res, result) =>
  returnResponse(req, res, {
    code: result.statusCode,
    success: result.success,
    status: result.success ? 'success' : 'error',
    message: result.message,
    data: result.data ?? null
  });

exports.getProfile = async (req, res) => {
  try {
    const result = await profileService.getProfile(req.user.id);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const result = await profileService.updateProfile(req.user.id, req.body);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};

exports.getMerchantOnboarding = async (req, res) => {
  try {
    const result = await profileService.getMerchantOnboarding(req.user.id);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};
