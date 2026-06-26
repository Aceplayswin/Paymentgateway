require('dotenv').config();

const bcrypt = require('bcrypt');
const pool = require('../config/db');
const User = require('../models/user.model');
const PayinTransaction = require('../models/payinTransaction.model');
const PayoutTransaction = require('../models/payoutTransaction.model');
const Settlement = require('../models/settlement.model');
const Ledger = require('../models/ledger.model');
const Dispute = require('../models/dispute.model');
const IpWhitelist = require('../models/ipWhitelist.model');
const PayoutBalance = require('../models/payoutBalance.model');

const DEMO_PASSWORD = 'Test@1234';
const ADMIN_EMAIL = 'admin@paygate.com';

const daysAgo = (days, hour = 12) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 30, 0, 0);
  return date;
};

const monthsAgo = (months, day = 15) => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  date.setDate(day);
  date.setHours(10, 0, 0, 0);
  return date;
};

const MERCHANT_SEEDS = [
  {
    username: 'acme_retail',
    firstName: 'Acme',
    lastName: 'Retail',
    email: 'acme.retail@example.com',
    phoneNumber: '9876500000',
    businessLabel: 'Acme Retail'
  },
  {
    username: 'urban_cart',
    firstName: 'Urban',
    lastName: 'Cart',
    email: 'urban.cart@example.com',
    phoneNumber: '9876500001',
    businessLabel: 'Urban Cart'
  },
  {
    username: 'bluebasket_grocers',
    firstName: 'Bluebasket',
    lastName: 'Grocers',
    email: 'bluebasket@example.com',
    phoneNumber: '9876500002',
    businessLabel: 'Bluebasket Grocers'
  },
  {
    username: 'flysmart_travels',
    firstName: 'FlySmart',
    lastName: 'Travels',
    email: 'flysmart@example.com',
    phoneNumber: '9876500003',
    businessLabel: 'FlySmart Travels'
  }
];

const PAYIN_SEEDS = [
  { transactionId: 'TXN2948011', orderId: 'ORD78211', customerName: 'Riya Sharma', merchantKey: 'acme_retail', amount: 42500, paymentMethod: 'UPI', status: 'success', daysAgo: 0, hour: 19 },
  { transactionId: 'TXN2948012', orderId: 'ORD78212', customerName: 'Arjun Patel', merchantKey: 'acme_retail', amount: 9800, paymentMethod: 'Card', status: 'failed', daysAgo: 0, hour: 19 },
  { transactionId: 'TXN2948013', orderId: 'ORD78213', customerName: 'Neha Verma', merchantKey: 'acme_retail', amount: 18250, paymentMethod: 'Wallet', status: 'pending', daysAgo: 0, hour: 19 },
  { transactionId: 'TXN2948014', orderId: 'ORD78214', customerName: 'Karan Singh', merchantKey: 'acme_retail', amount: 122000, paymentMethod: 'Net Banking', status: 'success', daysAgo: 0, hour: 19 },
  { transactionId: 'TXN2948015', orderId: 'ORD78215', customerName: 'Sneha Nair', merchantKey: 'acme_retail', amount: 56900, paymentMethod: 'UPI', status: 'success', daysAgo: 0, hour: 19 },
  { transactionId: 'TXN2948016', orderId: 'ORD78216', customerName: 'Aman Gupta', merchantKey: 'acme_retail', amount: 7600, paymentMethod: 'Card', status: 'refunded', daysAgo: 0, hour: 19 },
  { transactionId: 'TXN2948017', orderId: 'ORD78217', customerName: 'Vikram Malhotra', merchantKey: 'urban_cart', amount: 12300, paymentMethod: 'UPI', status: 'success', daysAgo: 0, hour: 17 },
  { transactionId: 'TXN2948018', orderId: 'ORD78218', customerName: 'Preeti Sen', merchantKey: 'bluebasket_grocers', amount: 4500, paymentMethod: 'Card', status: 'failed', daysAgo: 1, hour: 16 },
  { transactionId: 'TXN2948019', orderId: 'ORD78219', customerName: 'Rajesh Kumar', merchantKey: 'flysmart_travels', amount: 89000, paymentMethod: 'Card', status: 'success', daysAgo: 1, hour: 15 },
  { transactionId: 'TXN2948020', orderId: 'ORD78220', customerName: 'Siddharth Roy', merchantKey: 'urban_cart', amount: 25600, paymentMethod: 'UPI', status: 'pending', daysAgo: 1, hour: 13 },
  { transactionId: 'TXN2948028', orderId: 'ORD78228', customerName: 'Jan Revenue', merchantKey: 'urban_cart', amount: 2100000, paymentMethod: 'UPI', status: 'success', monthsAgo: 5, monthDay: 10 },
  { transactionId: 'TXN2948029', orderId: 'ORD78229', customerName: 'Feb Revenue', merchantKey: 'bluebasket_grocers', amount: 2340000, paymentMethod: 'Card', status: 'success', monthsAgo: 4, monthDay: 10 },
  { transactionId: 'TXN2948030', orderId: 'ORD78230', customerName: 'Mar Revenue', merchantKey: 'flysmart_travels', amount: 2560000, paymentMethod: 'UPI', status: 'success', monthsAgo: 3, monthDay: 10 },
  { transactionId: 'TXN2948031', orderId: 'ORD78231', customerName: 'Apr Revenue', merchantKey: 'urban_cart', amount: 2720000, paymentMethod: 'Net Banking', status: 'success', monthsAgo: 2, monthDay: 10 },
  { transactionId: 'TXN2948032', orderId: 'ORD78232', customerName: 'May Revenue', merchantKey: 'bluebasket_grocers', amount: 2860000, paymentMethod: 'UPI', status: 'success', monthsAgo: 1, monthDay: 10 },
  { transactionId: 'TXN2948033', orderId: 'ORD78233', customerName: 'Jun Revenue', merchantKey: 'flysmart_travels', amount: 3010000, paymentMethod: 'UPI', status: 'success', monthsAgo: 0, monthDay: 10 },
  { transactionId: 'TXN2947992', orderId: 'ORD78192', customerName: 'Refund Callback 2', merchantKey: 'acme_retail', amount: 8600, paymentMethod: 'Card', status: 'refunded', daysAgo: 0, hour: 17 },
  { transactionId: 'TXN2947940', orderId: 'ORD78140', customerName: 'Refund Callback 3', merchantKey: 'acme_retail', amount: 1250, paymentMethod: 'UPI', status: 'refunded', daysAgo: 0, hour: 16 }
];

const SETTLEMENT_SEEDS = [
  { settlementId: 'STL77821', merchantKey: 'acme_retail', totalAmount: 1240000, fees: 18900, netAmount: 1217698, settlementStatus: 'settled', daysAgo: 0 },
  { settlementId: 'STL77822', merchantKey: 'acme_retail', totalAmount: 880000, fees: 13640, netAmount: 863905, settlementStatus: 'processing', daysAgo: 1 },
  { settlementId: 'STL77823', merchantKey: 'acme_retail', totalAmount: 540000, fees: 8910, netAmount: 529487, settlementStatus: 'failed', daysAgo: 2 },
  { settlementId: 'STL77824', merchantKey: 'urban_cart', totalAmount: 450000, fees: 6750, netAmount: 442035, settlementStatus: 'settled', daysAgo: 1 },
  { settlementId: 'STL77825', merchantKey: 'bluebasket_grocers', totalAmount: 210000, fees: 3150, netAmount: 206283, settlementStatus: 'processing', daysAgo: 14 },
  { settlementId: 'STL77826', merchantKey: 'flysmart_travels', totalAmount: 320000, fees: 4800, netAmount: 315200, settlementStatus: 'settled', daysAgo: 21 },
  { settlementId: 'STL77827', merchantKey: 'urban_cart', totalAmount: 180000, fees: 2700, netAmount: 177300, settlementStatus: 'settled', daysAgo: 28 },
  { settlementId: 'STLREV01', merchantKey: 'urban_cart', totalAmount: 2100000, fees: 340000, netAmount: 1760000, settlementStatus: 'settled', monthsAgo: 5, monthDay: 10 },
  { settlementId: 'STLREV02', merchantKey: 'bluebasket_grocers', totalAmount: 2340000, fees: 350000, netAmount: 1990000, settlementStatus: 'settled', monthsAgo: 4, monthDay: 10 },
  { settlementId: 'STLREV03', merchantKey: 'flysmart_travels', totalAmount: 2560000, fees: 380000, netAmount: 2180000, settlementStatus: 'settled', monthsAgo: 3, monthDay: 10 },
  { settlementId: 'STLREV04', merchantKey: 'urban_cart', totalAmount: 2720000, fees: 390000, netAmount: 2330000, settlementStatus: 'settled', monthsAgo: 2, monthDay: 10 },
  { settlementId: 'STLREV05', merchantKey: 'bluebasket_grocers', totalAmount: 2860000, fees: 410000, netAmount: 2450000, settlementStatus: 'settled', monthsAgo: 1, monthDay: 10 },
  { settlementId: 'STLREV06', merchantKey: 'flysmart_travels', totalAmount: 3010000, fees: 400000, netAmount: 2610000, settlementStatus: 'settled', monthsAgo: 0, monthDay: 10 }
];

const COMPLAINT_SEEDS = [
  { disputeId: 'CMP3211', transactionId: 'TXN2948011', type: 'complaint', reason: 'Settlement Delay', status: 'open' },
  { disputeId: 'CMP3212', transactionId: 'TXN2948018', type: 'complaint', reason: 'Refund Mismatch', status: 'under_review' },
  { disputeId: 'CMP3213', transactionId: 'TXN2948019', type: 'complaint', reason: 'API Error', status: 'open' },
  { disputeId: 'CMP3214', transactionId: 'TXN2948014', type: 'complaint', reason: 'Refund Processing', status: 'resolved' },
  { disputeId: 'CMP3215', transactionId: 'TXN2948015', type: 'complaint', reason: 'Chargeback Dispute', status: 'resolved' }
];

const CHARGEBACK_SEEDS = [
  { disputeId: 'DSP5512', transactionId: 'TXN2948012', type: 'chargeback', reason: 'Fraud Suspected', status: 'open', resolutionNotes: 'Awaiting merchant evidence upload' },
  { disputeId: 'DSP5513', transactionId: 'TXN2947992', type: 'chargeback', reason: 'Duplicate Debit', status: 'under_review', resolutionNotes: 'Bank partner reviewing logs' },
  { disputeId: 'DSP5514', transactionId: 'TXN2947940', type: 'lien', reason: 'Service Not Delivered', status: 'resolved', resolutionNotes: 'Chargeback reversed after proof' }
];

const PAYOUT_SEEDS = [
  { payoutId: 'POT88211', merchantKey: 'acme_retail', beneficiaryName: 'Nikhil Jain', bankDetails: 'HDFC •••• 1128', amount: 240000, status: 'success', daysAgo: 0, hour: 18 },
  { payoutId: 'POT88212', merchantKey: 'acme_retail', beneficiaryName: 'Aastha Foods', bankDetails: 'ICICI •••• 7712', amount: 95000, status: 'pending', daysAgo: 0, hour: 17 },
  { payoutId: 'POT88213', merchantKey: 'acme_retail', beneficiaryName: 'Zentex Services', bankDetails: 'SBI •••• 9810', amount: 310000, status: 'failed', daysAgo: 0, hour: 17 },
  { payoutId: 'POT88214', merchantKey: 'urban_cart', beneficiaryName: 'Suresh Kumar', bankDetails: 'ICICI •••• 9921', amount: 120000, status: 'success', daysAgo: 0, hour: 16 }
];

const LEDGER_SEEDS = [
  { entryId: 'LDG22011', merchantKey: 'acme_retail', debitCredit: 'credit', amount: 42500, balance: 6870240, referenceId: 'TXN2948011', daysAgo: 0, hour: 19 },
  { entryId: 'LDG22012', merchantKey: 'acme_retail', debitCredit: 'debit', amount: 42500, balance: 6827740, referenceId: 'POT88211', daysAgo: 0, hour: 18 },
  { entryId: 'LDG22013', merchantKey: 'acme_retail', debitCredit: 'credit', amount: 4800, balance: 6832540, referenceId: 'TXN2948015', daysAgo: 0, hour: 19 },
  { entryId: 'LDG22014', merchantKey: 'urban_cart', debitCredit: 'credit', amount: 12300, balance: 1520000, referenceId: 'TXN2948017', daysAgo: 0, hour: 15 }
];

const BALANCE_SEEDS = {
  acme_retail: { availableBalance: 6870240, pendingAmount: 1240880, totalBalance: 8111120 },
  urban_cart: { availableBalance: 1520000, pendingAmount: 85000, totalBalance: 1605000 },
  bluebasket_grocers: { availableBalance: 420000, pendingAmount: 32000, totalBalance: 452000 },
  flysmart_travels: { availableBalance: 880000, pendingAmount: 45000, totalBalance: 925000 }
};

async function ensureAdminUser(hashedPassword) {
  const existing = await User.findByEmail(ADMIN_EMAIL);

  if (existing) {
    if (existing.role !== 'admin') {
      await User.update(existing.id, { role: 'admin', approvalStatus: 'approved', kycStatus: 'verified' });
    }
    return existing.id;
  }

  const admin = await User.create({
    username: 'platform_admin',
    firstName: 'Platform',
    lastName: 'Admin',
    email: ADMIN_EMAIL,
    phoneNumber: '9999900000',
    password: hashedPassword,
    role: 'admin',
    approvalStatus: 'approved',
    kycStatus: 'verified',
    otpVerifiedAt: new Date()
  });

  return admin.id;
}

async function ensureMerchant(seed, hashedPassword, adminId) {
  const existing = await User.findByEmail(seed.email);

  if (existing) {
    await User.update(existing.id, {
      approvalStatus: 'approved',
      kycStatus: 'verified',
      approvedAt: existing.approvedAt || new Date(),
      approvedBy: adminId,
      otpVerifiedAt: existing.otpVerifiedAt || new Date()
    });
    return { id: existing.id, businessLabel: seed.businessLabel, username: seed.username };
  }

  const merchant = await User.create({
    username: seed.username,
    firstName: seed.firstName,
    lastName: seed.lastName,
    email: seed.email,
    phoneNumber: seed.phoneNumber,
    password: hashedPassword,
    role: 'merchant',
    approvalStatus: 'approved',
    kycStatus: 'verified',
    approvalRequestedAt: new Date(),
    otpVerifiedAt: new Date()
  });

  await User.update(merchant.id, {
    approvedAt: new Date(),
    approvedBy: adminId
  });

  return { id: merchant.id, businessLabel: seed.businessLabel, username: seed.username };
}

async function upsertPayin(row, merchantMap) {
  const userId = merchantMap[row.merchantKey]?.id;
  if (!userId) return;

  const dateTime =
    row.monthsAgo != null
      ? monthsAgo(row.monthsAgo, row.monthDay ?? 15)
      : daysAgo(row.daysAgo ?? 0, row.hour ?? 12);

  const existing = await PayinTransaction.findById(row.transactionId);
  if (existing) {
    await PayinTransaction.update(row.transactionId, {
      customerName: row.customerName,
      amount: row.amount,
      paymentMethod: row.paymentMethod,
      status: row.status,
      dateTime,
      userId
    });
    return;
  }

  await PayinTransaction.create({
    transactionId: row.transactionId,
    orderId: row.orderId,
    customerName: row.customerName,
    amount: row.amount,
    paymentMethod: row.paymentMethod,
    status: row.status,
    dateTime,
    userId
  });
}

async function upsertSettlement(row, merchantMap) {
  const userId = merchantMap[row.merchantKey]?.id;
  if (!userId) return;

  const settlementDate =
    row.monthsAgo != null
      ? monthsAgo(row.monthsAgo, row.monthDay ?? 15)
      : daysAgo(row.daysAgo ?? 0);
  settlementDate.setHours(0, 0, 0, 0);

  const existing = await Settlement.findById(row.settlementId);
  if (existing) {
    await pool.execute(
      `UPDATE settlements
       SET total_amount = ?, fees = ?, net_amount = ?, settlement_status = ?,
           settlement_date = ?, user_id = ?, updated_at = ?
       WHERE settlement_id = ?`,
      [
        row.totalAmount,
        row.fees,
        row.netAmount,
        row.settlementStatus,
        settlementDate,
        userId,
        new Date(),
        row.settlementId
      ]
    );
    return;
  }

  await Settlement.create({
    settlementId: row.settlementId,
    totalAmount: row.totalAmount,
    fees: row.fees,
    netAmount: row.netAmount,
    settlementStatus: row.settlementStatus,
    settlementDate,
    userId
  });
}

async function upsertPayout(row, merchantMap) {
  const userId = merchantMap[row.merchantKey]?.id;
  if (!userId) return;

  const timestamp = daysAgo(row.daysAgo ?? 0, row.hour ?? 12);
  const existing = await PayoutTransaction.findById(row.payoutId);

  if (existing) {
    await PayoutTransaction.update(row.payoutId, {
      beneficiaryName: row.beneficiaryName,
      bankDetails: row.bankDetails,
      amount: row.amount,
      status: row.status,
      timestamp,
      userId
    });
    return;
  }

  await PayoutTransaction.create({
    payoutId: row.payoutId,
    beneficiaryName: row.beneficiaryName,
    bankDetails: row.bankDetails,
    amount: row.amount,
    status: row.status,
    timestamp,
    userId
  });
}

async function upsertLedger(row, merchantMap) {
  const userId = merchantMap[row.merchantKey]?.id;
  if (!userId) return;

  const timestamp = daysAgo(row.daysAgo ?? 0, row.hour ?? 12);
  const existing = await Ledger.findById(row.entryId);

  if (existing) {
    await pool.execute(
      `UPDATE ledger
       SET debit_credit = ?, amount = ?, balance = ?, reference_id = ?, \`timestamp\` = ?, user_id = ?, updated_at = ?
       WHERE entry_id = ?`,
      [
        row.debitCredit,
        row.amount,
        row.balance,
        row.referenceId,
        timestamp,
        userId,
        new Date(),
        row.entryId
      ]
    );
    return;
  }

  await Ledger.create({
    entryId: row.entryId,
    debitCredit: row.debitCredit,
    amount: row.amount,
    balance: row.balance,
    referenceId: row.referenceId,
    timestamp,
    userId
  });
}

async function seedBulkAnalytics(merchantMap) {
  await pool.query("DELETE FROM payin_transactions WHERE transaction_id LIKE 'BULK%'");
  await pool.query(
    `DELETE FROM payin_transactions
     WHERE transaction_id IN (
       'TXN2948021','TXN2948022','TXN2948023','TXN2948024',
       'TXN2948025','TXN2948026','TXN2948027'
     )`
  );

  const merchants = Object.values(merchantMap);
  if (!merchants.length) return;

  const pickMerchant = (index) => merchants[index % merchants.length].id;
  const pickMethod = (index) => {
    const roll = index % 100;
    if (roll < 54) return 'UPI';
    if (roll < 80) return 'Card';
    if (roll < 94) return 'Wallet';
    return 'Net Banking';
  };

  const mysqlDowVolume = {
    1: 1620,
    2: 1420,
    3: 1580,
    4: 1650,
    5: 1490,
    6: 1740,
    7: 1880
  };

  const TARGET_SUCCESS = 14820;
  const TARGET_FAILED = 432;
  const TARGET_TODAY_AMOUNT = 1840000;
  const TARGET_MONTH_AMOUNT = 28600000;

  const [[existing]] = await pool.query(
    `SELECT
       SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
       COALESCE(SUM(CASE WHEN status = 'success' AND DATE(date_time) = CURDATE() THEN amount ELSE 0 END), 0) AS today_amount,
       COALESCE(SUM(CASE WHEN status = 'success' AND date_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN amount ELSE 0 END), 0) AS month_amount
     FROM payin_transactions`
  );

  const successNeeded = Math.max(0, TARGET_SUCCESS - Number(existing.success_count || 0));
  const failedNeeded = Math.max(0, TARGET_FAILED - Number(existing.failed_count || 0));
  const todayAmountNeeded = Math.max(0, TARGET_TODAY_AMOUNT - Number(existing.today_amount || 0));
  const monthAmountNeeded = Math.max(0, TARGET_MONTH_AMOUNT - Number(existing.month_amount || 0));

  const volumePlan = [];
  for (let daysAgoIndex = 0; daysAgoIndex <= 6; daysAgoIndex += 1) {
    const date = daysAgo(daysAgoIndex, 10);
    const mysqlDow = date.getDay() + 1;
    volumePlan.push({
      date,
      count: mysqlDowVolume[mysqlDow] || 1000
    });
  }

  const todayPlan = volumePlan[0];
  const todayBulkCount = Math.min(todayPlan.count, successNeeded);
  const todayBulkAmount = Math.min(todayAmountNeeded, monthAmountNeeded);
  const todayUnitAmount = todayBulkCount > 0 ? Math.floor(todayBulkAmount / todayBulkCount) : 0;
  const todayRemainder = todayBulkCount > 0 ? todayBulkAmount - todayUnitAmount * todayBulkCount : 0;

  const rows = [];
  let bulkIndex = 0;
  const now = new Date();

  const pushRow = (status, amount, dateTime, merchantId) => {
    bulkIndex += 1;
    const suffix = String(bulkIndex).padStart(7, '0');
    rows.push([
      `BULK${suffix}`,
      `ORD${suffix}`,
      `Bulk Customer ${suffix}`,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      amount,
      pickMethod(bulkIndex),
      status,
      dateTime,
      merchantId,
      now,
      now
    ]);
  };

  let successInserted = 0;
  for (let dayIndex = 0; dayIndex < volumePlan.length && successInserted < successNeeded; dayIndex += 1) {
    const plan = volumePlan[dayIndex];
    const [[dayExisting]] = await pool.query(
      'SELECT COUNT(*) AS total FROM payin_transactions WHERE DATE(date_time) = DATE(?)',
      [plan.date]
    );
    const mysqlDow = plan.date.getDay() + 1;
    const targetForDay = mysqlDowVolume[mysqlDow] || 1000;
    const dayLimit = Math.max(
      0,
      Math.min(targetForDay - Number(dayExisting.total || 0), successNeeded - successInserted)
    );

    for (let i = 0; i < dayLimit; i += 1) {
      let amount = 1;
      if (dayIndex === 0 && successInserted < todayBulkCount) {
        amount = todayUnitAmount + (successInserted < todayRemainder ? 1 : 0);
      }
      pushRow('success', amount, plan.date, pickMerchant(successInserted));
      successInserted += 1;
    }
  }

  const monthAmountInserted =
    todayBulkCount * todayUnitAmount + Math.min(todayRemainder, todayBulkCount);
  let remainingMonthAmount = Math.max(0, monthAmountNeeded - monthAmountInserted);
  const remainingSuccess = successNeeded - successInserted;
  const tailUnitAmount =
    remainingSuccess > 0 ? Math.max(1, Math.floor(remainingMonthAmount / remainingSuccess)) : 1;

  for (let i = 0; i < remainingSuccess; i += 1) {
    const date = daysAgo(8 + (i % 22), 11);
    let amount = tailUnitAmount;
    if (i === remainingSuccess - 1) {
      amount = Math.max(1, remainingMonthAmount);
    }
    remainingMonthAmount -= amount;
    pushRow('success', amount, date, pickMerchant(successInserted + i));
  }

  for (let i = 0; i < failedNeeded; i += 1) {
    pushRow('failed', 100, daysAgo(i % 30, 14), pickMerchant(i));
  }

  const chunkSize = 250;
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize);
    const placeholders = chunk
      .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .join(', ');
    await pool.query(
      `INSERT INTO payin_transactions
         (transaction_id, order_id, customer_name, customer_phone, gateway_provider,
          gateway_order_id, byte_transaction_id, utr, redirect_url, remark1, remark2,
          gateway_state, amount, payment_method, status, date_time, user_id, created_at, updated_at)
       VALUES ${placeholders}`,
      chunk.flat()
    );
  }
}

async function upsertDispute(row) {
  const txn = await PayinTransaction.findById(row.transactionId);
  if (!txn) return;

  const existing = await Dispute.findById(row.disputeId);
  if (existing) {
    await pool.execute(
      `UPDATE disputes
       SET transaction_id = ?, type = ?, reason = ?, status = ?, resolution_notes = ?, updated_at = ?
       WHERE dispute_id = ?`,
      [
        row.transactionId,
        row.type || 'complaint',
        row.reason,
        row.status || 'open',
        row.resolutionNotes || null,
        new Date(),
        row.disputeId
      ]
    );
    return;
  }

  await Dispute.create(row);
}

(async () => {
  try {
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const adminId = await ensureAdminUser(hashedPassword);

    const merchantMap = {};
    for (const seed of MERCHANT_SEEDS) {
      const merchant = await ensureMerchant(seed, hashedPassword, adminId);
      merchantMap[seed.username] = merchant;
    }

    if (merchantMap.flysmart_travels?.id) {
      await User.update(merchantMap.flysmart_travels.id, { kycStatus: 'pending' });
    }

    for (const row of PAYIN_SEEDS) {
      await upsertPayin(row, merchantMap);
    }

    for (const row of SETTLEMENT_SEEDS) {
      await upsertSettlement(row, merchantMap);
    }

    for (const row of COMPLAINT_SEEDS) {
      await upsertDispute(row);
    }
    for (const row of CHARGEBACK_SEEDS) {
      await upsertDispute(row);
    }

    for (const row of PAYOUT_SEEDS) {
      await upsertPayout(row, merchantMap);
    }

    for (const row of LEDGER_SEEDS) {
      await upsertLedger(row, merchantMap);
    }

    for (const [merchantKey, balance] of Object.entries(BALANCE_SEEDS)) {
      const userId = merchantMap[merchantKey]?.id;
      if (userId) {
        await PayoutBalance.upsert(userId, balance);
      }
    }

    const primaryMerchantId = merchantMap.acme_retail?.id || merchantMap.urban_cart?.id;
    if (primaryMerchantId) {
      const ipRows = [
        { allowedIpAddress: '103.87.211.20', status: 'active', addedDate: daysAgo(20) },
        { allowedIpAddress: '49.36.192.14', status: 'active', addedDate: daysAgo(22) },
        { allowedIpAddress: '27.56.88.190', status: 'inactive', addedDate: daysAgo(29) }
      ];

      for (const row of ipRows) {
        const [existing] = await pool.query(
          'SELECT id FROM ip_whitelist WHERE allowed_ip_address = ? LIMIT 1',
          [row.allowedIpAddress]
        );
        if (!existing.length) {
          await IpWhitelist.create({ ...row, userId: primaryMerchantId });
        }
      }
    }

    await seedBulkAnalytics(merchantMap);

    console.log('OK: demo data seeded for dashboard testing');
    console.log(`Admin login: ${ADMIN_EMAIL} / ${DEMO_PASSWORD}`);
    console.log(`Merchants: ${MERCHANT_SEEDS.map((m) => m.email).join(', ')} / ${DEMO_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();
