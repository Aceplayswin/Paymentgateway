const pool = require('../../config/db');
const PayoutTransaction = require('../../models/payoutTransaction.model');
const Ledger = require('../../models/ledger.model');
const IpWhitelist = require('../../models/ipWhitelist.model');
const PayoutBalance = require('../../models/payoutBalance.model');
const { formatAmount } = require('../../utils/formatters');
const {
  serializePayoutTableRow,
  serializeLedgerTableRow,
  serializeIpWhitelistEntry,
  serializeIpWhitelistTableRow
} = require('../../utils/dashboardSerializers');

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildUserFilter = (user, queryUserId) => {
  if (user.role === 'merchant') {
    return user.id;
  }
  if (queryUserId) {
    return parseInt(queryUserId, 10);
  }
  return undefined;
};

const normalizePayoutStatus = (status) => {
  if (!status) return undefined;
  const value = String(status).toLowerCase();
  if (value === 'processed') return 'success';
  return value;
};

const normalizeIpStatus = (status) => {
  if (!status) return undefined;
  const value = String(status).toLowerCase();
  if (value === 'enabled') return 'active';
  if (value === 'disabled') return 'inactive';
  return value;
};

const getSettlementBalanceTotal = async (userId) => {
  const values = [];
  let sql =
    "SELECT COALESCE(SUM(net_amount), 0) AS total FROM settlements WHERE settlement_status = 'settled'";

  if (userId !== undefined) {
    sql += ' AND user_id = ?';
    values.push(userId);
  }

  const [rows] = await pool.query(sql, values);
  return Number(rows[0]?.total || 0);
};

const getPayoutBalance = async (user) => {
  const isAdmin = user.role === 'admin';
  const userId = isAdmin ? undefined : user.id;

  const [balance, settlementBalance] = await Promise.all([
    isAdmin ? PayoutBalance.getPlatformTotals() : PayoutBalance.findByUserId(user.id),
    getSettlementBalanceTotal(userId)
  ]);

  const available = balance?.availableBalance ?? 0;
  const pending = balance?.pendingAmount ?? 0;

  return {
    statusCode: 200,
    success: true,
    message: 'Payout balance fetched successfully',
    data: {
      cards: [
        { title: 'Available Balance', value: formatAmount(available) },
        { title: 'Pending Balance', value: formatAmount(pending) },
        { title: 'Settlement Balance', value: formatAmount(settlementBalance) }
      ],
      summary: {
        availableBalance: available,
        pendingBalance: pending,
        settlementBalance
      }
    }
  };
};

const listPayoutTransactions = async (user, query) => {
  const { page, limit, offset } = parsePagination(query);
  const userId = buildUserFilter(user, query.userId);

  const { rows, count } = await PayoutTransaction.listAndCount({
    userId,
    status: normalizePayoutStatus(query.status),
    search: query.search,
    limit,
    offset
  });

  return {
    statusCode: 200,
    success: true,
    message: 'Payout transactions fetched successfully',
    data: rows.map(serializePayoutTableRow),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit) || 1
    }
  };
};

const listLedgerEntries = async (user, query) => {
  const { page, limit, offset } = parsePagination(query);
  const userId = buildUserFilter(user, query.userId);
  const debitCredit = query.type ? String(query.type).toLowerCase() : undefined;

  const { rows, count } = await Ledger.listAndCount({
    userId,
    debitCredit,
    search: query.search,
    limit,
    offset
  });

  return {
    statusCode: 200,
    success: true,
    message: 'Ledger entries fetched successfully',
    data: rows.map(serializeLedgerTableRow),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit) || 1
    }
  };
};

const listIpWhitelist = async (user, query) => {
  const { page, limit, offset } = parsePagination(query);
  const userId = buildUserFilter(user, query.userId);

  const { rows, count } = await IpWhitelist.listAndCount({
    userId,
    status: normalizeIpStatus(query.status),
    limit,
    offset
  });

  return {
    statusCode: 200,
    success: true,
    message: 'IP whitelist fetched successfully',
    data: rows.map((row) => serializeIpWhitelistTableRow(serializeIpWhitelistEntry(row))),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit) || 1
    }
  };
};

module.exports = {
  getPayoutBalance,
  listPayoutTransactions,
  listLedgerEntries,
  listIpWhitelist
};
