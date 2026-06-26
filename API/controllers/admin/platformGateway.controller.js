const platformGatewayService = require('./platformGateway.service');

const sendResult = (res, result) =>
  res.status(result.statusCode || 200).json({
    success: result.success,
    ...(result.message !== undefined ? { message: result.message } : {}),
    ...(result.data !== undefined ? { data: result.data } : {})
  });

// GET /api/admin/gateway  — list connected gateways + which one is active.
// Credentials come from the environment; none are returned here.
exports.listGateways = async (_req, res) => {
  try {
    const result = await platformGatewayService.listGateways();
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/gateway/status  — activate / deactivate a gateway.
exports.setStatus = async (req, res) => {
  try {
    const result = await platformGatewayService.setStatus(req, req.body);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
