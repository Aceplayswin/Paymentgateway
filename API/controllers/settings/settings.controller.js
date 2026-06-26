const returnResponse = require('../../utils/response');
const IpWhitelist = require('../../models/ipWhitelist.model');
const { serializeIpWhitelistEntry } = require('../../utils/dashboardSerializers');

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildUserFilter = (req) => {
  if (req.user.role === 'merchant') {
    return req.user.id;
  }
  if (req.query.userId) {
    return parseInt(req.query.userId, 10);
  }
  return undefined;
};

exports.listIpWhitelist = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const userId = buildUserFilter(req);

    const { rows, count } = await IpWhitelist.listAndCount({
      userId,
      status: req.query.status,
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      data: rows.map(serializeIpWhitelistEntry),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit) || 1
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createIpWhitelist = async (req, res) => {
  try {
    const { ip, status } = req.body;
    if (!ip) {
      return returnResponse(req, res, {
        code: 400,
        success: false,
        status: 'error',
        message: 'ip is required'
      });
    }

    const ownerId = req.user.role === 'merchant' ? req.user.id : req.body.userId || req.user.id;
    const normalizedStatus =
      status && String(status).toLowerCase() === 'disabled' ? 'inactive' : 'active';

    const created = await IpWhitelist.create({
      allowedIpAddress: ip,
      status: normalizedStatus,
      userId: ownerId
    });

    return returnResponse(req, res, {
      code: 201,
      success: true,
      message: 'IP whitelist entry created',
      data: serializeIpWhitelistEntry(created)
    });
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};

exports.updateIpWhitelist = async (req, res) => {
  try {
    const entry = await IpWhitelist.findById(req.params.id);
    if (!entry) {
      return returnResponse(req, res, {
        code: 404,
        success: false,
        status: 'error',
        message: 'IP whitelist entry not found'
      });
    }

    if (req.user.role === 'merchant' && entry.userId !== req.user.id) {
      return returnResponse(req, res, {
        code: 403,
        success: false,
        status: 'error',
        message: 'Not allowed to update this entry'
      });
    }

    const changes = {};
    if (req.body.ip !== undefined) changes.allowedIpAddress = req.body.ip;
    if (req.body.status !== undefined) {
      changes.status =
        String(req.body.status).toLowerCase() === 'disabled' ||
        String(req.body.status).toLowerCase() === 'inactive'
          ? 'inactive'
          : 'active';
    }

    const updated = await IpWhitelist.update(req.params.id, changes);

    return returnResponse(req, res, {
      code: 200,
      success: true,
      message: 'IP whitelist entry updated',
      data: serializeIpWhitelistEntry(updated)
    });
  } catch (error) {
    return returnResponse(req, res, { code: 500, success: false, status: 'error', message: error.message });
  }
};
