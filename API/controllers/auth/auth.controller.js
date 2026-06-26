const authService = require('./auth.service');
const { sanitizeClientErrorMessage } = require('../../utils/errorMessage');
const returnResponse = require('../../utils/response');

const send = (req, res, result) =>
  returnResponse(req, res, {
    code: result.statusCode,
    success: result.success,
    status: result.success ? 'success' : 'error',
    message: result.message,
    data: result.data ?? null,
  });

exports.register = async (req, res) => {
  try {
    const result = await authService.registerMerchant(req.body);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: sanitizeClientErrorMessage(error),
    });
  }
};

exports.login = async (req, res) => {
  try {
    const result = await authService.loginUser(req, req.body);

    const refreshToken = result.data?.refreshToken;
    if (refreshToken) {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: Number(process.env.REFRESH_TOKEN_MAX_AGE)
      });
    }

    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: sanitizeClientErrorMessage(error),
    });
  }
};

exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const result = await authService.verifyRegistrationOtp(req.body);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: sanitizeClientErrorMessage(error),
    });
  }
};

exports.verifyOtpAndLogin = async (req, res) => {
  try {
    const result = await authService.verifyOtpAndCompleteSignup(req.body);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: error.statusCode || 500,
      success: false,
      status: 'error',
      message: sanitizeClientErrorMessage(error, error.message),
    });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const result = await authService.resendSignupOtp(req.body);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: sanitizeClientErrorMessage(error),
    });
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    const result = await authService.refreshAccessToken(token);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: sanitizeClientErrorMessage(error),
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const result = await authService.requestPasswordReset(req.body);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: sanitizeClientErrorMessage(error),
    });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const result = await authService.verifyResetOtp(req.body);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: sanitizeClientErrorMessage(error),
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: sanitizeClientErrorMessage(error),
    });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await authService.getCurrentUser(req.user.id);
    return send(req, res, result);
  } catch (error) {
    return returnResponse(req, res, {
      code: 500,
      success: false,
      status: 'error',
      message: sanitizeClientErrorMessage(error),
    });
  }
};
