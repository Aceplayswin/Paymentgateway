export const merchantInfo = {
  name: "Acme Retail Pvt Ltd",
  merchantId: "MRC-IND-90871",
  plan: "Enterprise",
};

export const kpiData = [
  { title: "Today's Collection", value: "INR 18.4L", trend: "+12.5%", direction: "up" },
  { title: "Monthly Revenue", value: "INR 2.86Cr", trend: "+8.1%", direction: "up" },
  { title: "Successful Payments", value: "14,820", trend: "+4.8%", direction: "up" },
  { title: "Failed Payments", value: "432", trend: "-1.7%", direction: "down" },
  { title: "Pending Settlements", value: "INR 24.2L", trend: "+2.4%", direction: "up" },
  { title: "Available Balance", value: "INR 68.7L", trend: "+9.2%", direction: "up" },
  { title: "Refund Requests", value: "126", trend: "-3.9%", direction: "down" },
  { title: "Settlement Success Rate", value: "98.6%", trend: "+0.6%", direction: "up" },
];

export const revenueOverviewData = [
  { name: "Jan", revenue: 2100000, settlements: 1760000 },
  { name: "Feb", revenue: 2340000, settlements: 1990000 },
  { name: "Mar", revenue: 2560000, settlements: 2180000 },
  { name: "Apr", revenue: 2720000, settlements: 2330000 },
  { name: "May", revenue: 2860000, settlements: 2450000 },
  { name: "Jun", revenue: 3010000, settlements: 2610000 },
];

export const transactionVolumeData = [
  { day: "Mon", volume: 1420 },
  { day: "Tue", volume: 1580 },
  { day: "Wed", volume: 1650 },
  { day: "Thu", volume: 1490 },
  { day: "Fri", volume: 1740 },
  { day: "Sat", volume: 1880 },
  { day: "Sun", volume: 1620 },
];

export const methodMixData = [
  { name: "UPI", value: 54 },
  { name: "Cards", value: 26 },
  { name: "Wallets", value: 14 },
  { name: "Net Banking", value: 6 },
];

export const successFailureData = [
  { name: "Success", value: 94.8 },
  { name: "Failed", value: 5.2 },
];

export const settlementTrendData = [
  { name: "W1", settled: 46, delayed: 4 },
  { name: "W2", settled: 49, delayed: 3 },
  { name: "W3", settled: 52, delayed: 2 },
  { name: "W4", settled: 48, delayed: 4 },
];

export const monthlyRevenueGraphData = [
  { month: "Jul", amount: 2710000 },
  { month: "Aug", amount: 2820000 },
  { month: "Sep", amount: 2910000 },
  { month: "Oct", amount: 3020000 },
  { month: "Nov", amount: 3120000 },
  { month: "Dec", amount: 3260000 },
];

export const recentTransactions = [
  {
    transactionId: "TXN2948011",
    orderId: "ORD78211",
    customer: "Riya Sharma",
    merchant: "Acme Retail",
    amount: "INR 42,500",
    method: "UPI",
    status: "Success",
    timestamp: "02 Jun 2026, 07:42 PM",
  },
  {
    transactionId: "TXN2948012",
    orderId: "ORD78212",
    customer: "Arjun Patel",
    merchant: "Acme Retail",
    amount: "INR 9,800",
    method: "Card",
    status: "Failed",
    timestamp: "02 Jun 2026, 07:39 PM",
  },
  {
    transactionId: "TXN2948013",
    orderId: "ORD78213",
    customer: "Neha Verma",
    merchant: "Acme Retail",
    amount: "INR 18,250",
    method: "Wallet",
    status: "Pending",
    timestamp: "02 Jun 2026, 07:31 PM",
  },
  {
    transactionId: "TXN2948014",
    orderId: "ORD78214",
    customer: "Karan Singh",
    merchant: "Acme Retail",
    amount: "INR 1,22,000",
    method: "Net Banking",
    status: "Success",
    timestamp: "02 Jun 2026, 07:20 PM",
  },
  {
    transactionId: "TXN2948015",
    orderId: "ORD78215",
    customer: "Sneha Nair",
    merchant: "Acme Retail",
    amount: "INR 56,900",
    method: "UPI",
    status: "Success",
    timestamp: "02 Jun 2026, 07:18 PM",
  },
  {
    transactionId: "TXN2948016",
    orderId: "ORD78216",
    customer: "Aman Gupta",
    merchant: "Acme Retail",
    amount: "INR 7,600",
    method: "Card",
    status: "Refunded",
    timestamp: "02 Jun 2026, 07:11 PM",
  },
  {
    transactionId: "TXN2948017",
    orderId: "ORD78217",
    customer: "Vikram Malhotra",
    merchant: "Urban Cart",
    amount: "INR 12,300",
    method: "UPI",
    status: "Success",
    timestamp: "02 Jun 2026, 05:42 PM",
  },
  {
    transactionId: "TXN2948018",
    orderId: "ORD78218",
    customer: "Preeti Sen",
    merchant: "Bluebasket Grocers",
    amount: "INR 4,500",
    method: "Card",
    status: "Failed",
    timestamp: "01 Jun 2026, 04:39 PM",
  },
  {
    transactionId: "TXN2948019",
    orderId: "ORD78219",
    customer: "Rajesh Kumar",
    merchant: "FlySmart Travels",
    amount: "INR 89,000",
    method: "Card",
    status: "Success",
    timestamp: "01 Jun 2026, 03:20 PM",
  },
  {
    transactionId: "TXN2948020",
    orderId: "ORD78220",
    customer: "Siddharth Roy",
    merchant: "Urban Cart",
    amount: "INR 25,600",
    method: "UPI",
    status: "Pending",
    timestamp: "01 Jun 2026, 01:10 PM",
  },
];

export const merchantManagerData = [
  {
    merchantId: "MRC1001",
    merchantName: "Urban Cart",
    businessType: "E-commerce",
    kycStatus: "Verified",
    transactionVolume: "INR 1.4Cr",
    merchantStatus: "Active",
  },
  {
    merchantId: "MRC1002",
    merchantName: "Bluebasket Grocers",
    businessType: "Retail",
    kycStatus: "Pending",
    transactionVolume: "INR 42L",
    merchantStatus: "Under Review",
  },
  {
    merchantId: "MRC1003",
    merchantName: "FlySmart Travels",
    businessType: "Travel",
    kycStatus: "Verified",
    transactionVolume: "INR 88L",
    merchantStatus: "Active",
  },
];

export const settlementsData = [
  {
    settlementId: "STL77821",
    grossAmount: "INR 12,40,000",
    fees: "INR 18,900",
    gst: "INR 3,402",
    netSettlement: "INR 12,17,698",
    settlementStatus: "Settled",
    settlementDate: "02 Jun 2026",
    merchant: "Acme Retail",
  },
  {
    settlementId: "STL77822",
    grossAmount: "INR 8,80,000",
    fees: "INR 13,640",
    gst: "INR 2,455",
    netSettlement: "INR 8,63,905",
    settlementStatus: "Processing",
    settlementDate: "01 Jun 2026",
    merchant: "Acme Retail",
  },
  {
    settlementId: "STL77823",
    grossAmount: "INR 5,40,000",
    fees: "INR 8,910",
    gst: "INR 1,603",
    netSettlement: "INR 5,29,487",
    settlementStatus: "Failed",
    settlementDate: "31 May 2026",
    merchant: "Acme Retail",
  },
  {
    settlementId: "STL77824",
    grossAmount: "INR 4,50,000",
    fees: "INR 6,750",
    gst: "INR 1,215",
    netSettlement: "INR 4,42,035",
    settlementStatus: "Settled",
    settlementDate: "01 Jun 2026",
    merchant: "Urban Cart",
  },
  {
    settlementId: "STL77825",
    grossAmount: "INR 2,10,000",
    fees: "INR 3,150",
    gst: "INR 567",
    netSettlement: "INR 2,06,283",
    settlementStatus: "Processing",
    settlementDate: "31 May 2026",
    merchant: "Bluebasket Grocers",
  },
];

export const complaintsData = [
  {
    complaintId: "CMP3211",
    merchant: "Urban Cart",
    issueType: "Settlement Delay",
    priority: "High",
    status: "Open",
    timeline: "Raised 3h ago",
  },
  {
    complaintId: "CMP3212",
    merchant: "Bluebasket Grocers",
    issueType: "Refund Mismatch",
    priority: "Medium",
    status: "Investigating",
    timeline: "Raised 1d ago",
  },
  {
    complaintId: "CMP3213",
    merchant: "FlySmart Travels",
    issueType: "API Error",
    priority: "Critical",
    status: "Open",
    timeline: "Raised 52m ago",
  },
  {
    complaintId: "CMP3214",
    merchant: "Acme Retail",
    issueType: "Refund Processing",
    priority: "Low",
    status: "Closed",
    timeline: "Resolved 2d ago",
  },
  {
    complaintId: "CMP3215",
    merchant: "Acme Retail",
    issueType: "Chargeback Dispute",
    priority: "High",
    status: "Open",
    timeline: "Raised 1d ago",
  },
];

export const payoutTransactionsData = [
  {
    payoutId: "POT88211",
    beneficiaryName: "Nikhil Jain",
    bankDetails: "HDFC •••• 1128",
    amount: "INR 2,40,000",
    status: "Processed",
    timestamp: "02 Jun 2026, 06:40 PM",
    merchant: "Acme Retail",
  },
  {
    payoutId: "POT88212",
    beneficiaryName: "Aastha Foods",
    bankDetails: "ICICI •••• 7712",
    amount: "INR 95,000",
    status: "Pending",
    timestamp: "02 Jun 2026, 05:52 PM",
    merchant: "Acme Retail",
  },
  {
    payoutId: "POT88213",
    beneficiaryName: "Zentex Services",
    bankDetails: "SBI •••• 9810",
    amount: "INR 3,10,000",
    status: "Failed",
    timestamp: "02 Jun 2026, 05:11 PM",
    merchant: "Acme Retail",
  },
  {
    payoutId: "POT88214",
    beneficiaryName: "Suresh Kumar",
    bankDetails: "ICICI •••• 9921",
    amount: "INR 1,20,000",
    status: "Processed",
    timestamp: "02 Jun 2026, 04:10 PM",
    merchant: "Urban Cart",
  },
];

export const ipWhitelistData = [
  { ip: "103.87.211.20", status: "Enabled", addedDate: "20 May 2026" },
  { ip: "49.36.192.14", status: "Enabled", addedDate: "18 May 2026" },
  { ip: "27.56.88.190", status: "Disabled", addedDate: "11 May 2026" },
];

export const ledgerData = [
  {
    entryId: "LDG22011",
    type: "Credit",
    balance: "INR 68,70,240",
    referenceId: "TXN2948011",
    timestamp: "02 Jun 2026, 07:42 PM",
    merchant: "Acme Retail",
  },
  {
    entryId: "LDG22012",
    type: "Debit",
    balance: "INR 68,27,740",
    referenceId: "POT88211",
    timestamp: "02 Jun 2026, 06:40 PM",
    merchant: "Acme Retail",
  },
  {
    entryId: "LDG22013",
    type: "Credit",
    balance: "INR 68,32,540",
    referenceId: "TXN2948015",
    timestamp: "02 Jun 2026, 07:18 PM",
    merchant: "Acme Retail",
  },
  {
    entryId: "LDG22014",
    type: "Credit",
    balance: "INR 15,20,000",
    referenceId: "TXN2948017",
    timestamp: "02 Jun 2026, 03:42 PM",
    merchant: "Urban Cart",
  },
];
