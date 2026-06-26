const PayinTransaction = require('../models/payinTransaction.model');
const PayoutTransaction = require('../models/payoutTransaction.model');
const Settlement = require('../models/settlement.model');
const Ledger = require('../models/ledger.model');
const Dispute = require('../models/dispute.model');
const {
  serializePayinTransaction,
  serializePayoutTransaction,
  generatePayinTransactionId,
  generatePayoutId
} = require('../utils/transactionFormat');
const {
  serializeSettlement,
  serializeLedgerEntry,
  serializeComplaint
} = require('../utils/dashboardSerializers');

const PAYIN_STATUSES = ['pending', 'success', 'failed', 'refunded'];
const PAYOUT_STATUSES = ['pending', 'processing', 'success', 'failed'];

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

exports.listPayinTransactions = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const filter = {};
    const userId = buildUserFilter(req);
    if (userId !== undefined) filter.userId = userId;
    if (req.query.status) filter.status = String(req.query.status).toLowerCase();
    if (req.query.search) filter.search = req.query.search;

    const { rows, count } = await PayinTransaction.listAndCount({
      ...filter,
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      data: rows.map(serializePayinTransaction),
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

exports.getPayinTransaction = async (req, res) => {
  try {
    const query = { transactionId: req.params.transactionId };
    const userId = buildUserFilter(req);
    if (userId !== undefined) query.userId = userId;

    const transaction = await PayinTransaction.findOne(query);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    return res.status(200).json({ success: true, data: serializePayinTransaction(transaction) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPayinTransaction = async (req, res) => {
  try {
    const { transactionId, orderId, customerName, amount, paymentMethod, status, dateTime } =
      req.body;

    if (!orderId || !customerName || amount == null || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'orderId, customerName, amount, and paymentMethod are required'
      });
    }

    const normalizedStatus = status ? String(status).toLowerCase() : 'pending';
    if (!PAYIN_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${PAYIN_STATUSES.join(', ')}`
      });
    }

    const userId =
      req.user.role === 'merchant' ? req.user.id : req.body.userId || req.user.id;

    const created = await PayinTransaction.create({
      transactionId: transactionId || generatePayinTransactionId(),
      orderId,
      customerName,
      amount,
      paymentMethod,
      status: normalizedStatus,
      dateTime: dateTime || new Date(),
      userId
    });

    return res.status(201).json({
      success: true,
      message: 'Payin transaction created',
      data: serializePayinTransaction(created)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePayinTransaction = async (req, res) => {
  try {
    const query = { transactionId: req.params.transactionId };
    const userId = buildUserFilter(req);
    if (userId !== undefined) query.userId = userId;

    const transaction = await PayinTransaction.findOne(query);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const { orderId, customerName, amount, paymentMethod, status, dateTime } = req.body;
    const changes = {};

    if (status !== undefined) {
      const normalizedStatus = String(status).toLowerCase();
      if (!PAYIN_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${PAYIN_STATUSES.join(', ')}`
        });
      }
      changes.status = normalizedStatus;
    }

    if (orderId !== undefined) changes.orderId = orderId;
    if (customerName !== undefined) changes.customerName = customerName;
    if (amount !== undefined) changes.amount = amount;
    if (paymentMethod !== undefined) changes.paymentMethod = paymentMethod;
    if (dateTime !== undefined) changes.dateTime = dateTime;

    const updated = await PayinTransaction.update(transaction.transactionId, changes);

    return res.status(200).json({
      success: true,
      message: 'Payin transaction updated',
      data: serializePayinTransaction(updated)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.listPayoutTransactions = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const filter = {};
    const userId = buildUserFilter(req);
    if (userId !== undefined) filter.userId = userId;

    if (req.query.status) {
      const s = String(req.query.status).toLowerCase();
      filter.status = s === 'processed' ? 'success' : s;
    }

    if (req.query.search) filter.search = req.query.search;

    const { rows, count } = await PayoutTransaction.listAndCount({
      ...filter,
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      data: rows.map(serializePayoutTransaction),
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

exports.getPayoutTransaction = async (req, res) => {
  try {
    const query = { payoutId: req.params.payoutId };
    const userId = buildUserFilter(req);
    if (userId !== undefined) query.userId = userId;

    const transaction = await PayoutTransaction.findOne(query);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Payout transaction not found' });
    }

    return res.status(200).json({ success: true, data: serializePayoutTransaction(transaction) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPayoutTransaction = async (req, res) => {
  try {
    const { payoutId, beneficiaryName, bankDetails, amount, status, timestamp } = req.body;

    if (!beneficiaryName || !bankDetails || amount == null) {
      return res.status(400).json({
        success: false,
        message: 'beneficiaryName, bankDetails, and amount are required'
      });
    }

    const normalizedStatus = status ? String(status).toLowerCase() : 'pending';
    const dbStatus = normalizedStatus === 'processed' ? 'success' : normalizedStatus;

    if (!PAYOUT_STATUSES.includes(dbStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${PAYOUT_STATUSES.join(', ')}, or processed`
      });
    }

    const userId =
      req.user.role === 'merchant' ? req.user.id : req.body.userId || req.user.id;

    const created = await PayoutTransaction.create({
      payoutId: payoutId || generatePayoutId(),
      beneficiaryName,
      bankDetails,
      amount,
      status: dbStatus,
      timestamp: timestamp || new Date(),
      userId
    });

    return res.status(201).json({
      success: true,
      message: 'Payout transaction created',
      data: serializePayoutTransaction(created)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePayoutTransaction = async (req, res) => {
  try {
    const query = { payoutId: req.params.payoutId };
    const userId = buildUserFilter(req);
    if (userId !== undefined) query.userId = userId;

    const transaction = await PayoutTransaction.findOne(query);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Payout transaction not found' });
    }

    const { beneficiaryName, bankDetails, amount, status, timestamp } = req.body;
    const changes = {};

    if (status !== undefined) {
      const normalizedStatus = String(status).toLowerCase();
      const dbStatus = normalizedStatus === 'processed' ? 'success' : normalizedStatus;

      if (!PAYOUT_STATUSES.includes(dbStatus)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${PAYOUT_STATUSES.join(', ')}, or processed`
        });
      }
      changes.status = dbStatus;
    }

    if (beneficiaryName !== undefined) changes.beneficiaryName = beneficiaryName;
    if (bankDetails !== undefined) changes.bankDetails = bankDetails;
    if (amount !== undefined) changes.amount = amount;
    if (timestamp !== undefined) changes.timestamp = timestamp;

    const updated = await PayoutTransaction.update(transaction.payoutId, changes);

    return res.status(200).json({
      success: true,
      message: 'Payout transaction updated',
      data: serializePayoutTransaction(updated)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.listSettlements = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const userId = buildUserFilter(req);

    const { rows, count } = await Settlement.listAndCount({
      userId,
      status: req.query.status,
      search: req.query.search,
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      data: rows.map(serializeSettlement),
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

exports.getSettlement = async (req, res) => {
  try {
    const query = { settlementId: req.params.settlementId };
    const userId = buildUserFilter(req);
    if (userId !== undefined) query.userId = userId;

    const settlement = await Settlement.findOne(query);
    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found' });
    }

    return res.status(200).json({ success: true, data: serializeSettlement(settlement) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSettlement = async (req, res) => {
  try {
    const { settlementId, totalAmount, fees, netAmount, settlementStatus, settlementDate, userId } =
      req.body;

    if (totalAmount == null || netAmount == null) {
      return res.status(400).json({
        success: false,
        message: 'totalAmount and netAmount are required'
      });
    }

    const ownerId = req.user.role === 'merchant' ? req.user.id : userId || req.user.id;

    const created = await Settlement.create({
      settlementId: settlementId || Settlement.generateSettlementId(),
      totalAmount,
      fees: fees ?? 0,
      netAmount,
      settlementStatus: settlementStatus || 'pending',
      settlementDate: settlementDate || new Date(),
      userId: ownerId
    });

    return res.status(201).json({
      success: true,
      message: 'Settlement created',
      data: serializeSettlement(created)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.listLedgerEntries = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const userId = buildUserFilter(req);

    const { rows, count } = await Ledger.listAndCount({
      userId,
      search: req.query.search,
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      data: rows.map(serializeLedgerEntry),
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

exports.createLedgerEntry = async (req, res) => {
  try {
    const { entryId, debitCredit, amount, balance, referenceId, timestamp } = req.body;

    if (!debitCredit || amount == null || balance == null) {
      return res.status(400).json({
        success: false,
        message: 'debitCredit, amount, and balance are required'
      });
    }

    const ownerId = req.user.role === 'merchant' ? req.user.id : req.body.userId || req.user.id;

    const created = await Ledger.create({
      entryId: entryId || Ledger.generateEntryId(),
      debitCredit: String(debitCredit).toLowerCase(),
      amount,
      balance,
      referenceId,
      timestamp: timestamp || new Date(),
      userId: ownerId
    });

    return res.status(201).json({
      success: true,
      message: 'Ledger entry created',
      data: serializeLedgerEntry(created)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.listDisputes = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const userId = buildUserFilter(req);

    const { rows, count } = await Dispute.listAndCount({
      userId,
      type: req.query.type || 'complaint',
      status: req.query.status,
      search: req.query.search,
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      data: rows.map(serializeComplaint),
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

exports.createDispute = async (req, res) => {
  try {
    const { disputeId, transactionId, type, reason, status } = req.body;

    if (!transactionId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'transactionId and reason are required'
      });
    }

    const created = await Dispute.create({
      disputeId: disputeId || Dispute.generateDisputeId(),
      transactionId,
      type: type || 'complaint',
      reason,
      status: status || 'open'
    });

    return res.status(201).json({
      success: true,
      message: 'Dispute created',
      data: serializeComplaint(created)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
