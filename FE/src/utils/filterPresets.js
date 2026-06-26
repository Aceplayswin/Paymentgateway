import { buildFilterSections } from "./filterUtils";

const textOperators = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
];

export function getTransactionFilterSections(isAdmin = false) {
  return buildFilterSections({
    filterKey: "status",
    filterOptions: [
      { value: "success", label: "Success" },
      { value: "failed", label: "Failed" },
      { value: "pending", label: "Pending" },
      { value: "refunded", label: "Refunded" },
    ],
    extraSections: [
      {
        id: "method",
        label: "Payment Method",
        type: "select-text",
        field: "method",
        operators: textOperators,
        placeholder: "Type method",
      },
      ...(isAdmin
        ? [
            {
              id: "merchant",
              label: "Merchant",
              type: "select-text",
              field: "merchant",
              operators: textOperators,
              placeholder: "Type merchant",
            },
          ]
        : []),
      {
        id: "amountRange",
        label: "Amount Range",
        type: "range",
        field: "amount",
        min: 0,
        max: 200000,
        defaultValue: [0, 200000],
        format: "inr",
      },
    ],
  });
}

export const merchantDirectoryFilterSections = [
  {
    id: "approvalStatus",
    label: "Status",
    type: "select",
    field: "approvalStatus",
    options: [
      { value: "all", label: "All" },
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
    ],
  },
  {
    id: "searchField",
    label: "Search Field",
    type: "select-text",
    field: "__search__",
    operators: textOperators,
    placeholder: "Type value...",
  },
  {
    id: "owner",
    label: "Owner",
    type: "select-text",
    field: "email",
    operators: textOperators,
    placeholder: "Email or username",
  },
];

export const merchantManagerFilterSections = [
  {
    id: "merchantStatus",
    label: "Status",
    type: "select",
    field: "merchantStatus",
    options: [
      { value: "all", label: "All" },
      { value: "active", label: "Active" },
      { value: "under review", label: "Under Review" },
    ],
  },
  {
    id: "searchField",
    label: "Search Field",
    type: "select-text",
    field: "__search__",
    operators: textOperators,
    placeholder: "Type value...",
  },
  {
    id: "kycStatus",
    label: "KYC Status",
    type: "select-text",
    field: "kycStatus",
    operators: textOperators,
    placeholder: "Type KYC status",
  },
  {
    id: "businessType",
    label: "Business Type",
    type: "select-text",
    field: "businessType",
    operators: textOperators,
    placeholder: "Type business",
  },
];

export const newRequestFilterSections = [
  {
    id: "searchField",
    label: "Search Field",
    type: "select-text",
    field: "__search__",
    operators: textOperators,
    placeholder: "Type value...",
  },
  {
    id: "owner",
    label: "Owner",
    type: "select-text",
    field: "email",
    operators: textOperators,
    placeholder: "Email or merchant code",
  },
];

export const gatewayFilterSections = [
  {
    id: "status",
    label: "Status",
    type: "select",
    field: "status",
    options: [
      { value: "all", label: "All" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
  {
    id: "searchField",
    label: "Search Field",
    type: "select-text",
    field: "__search__",
    operators: textOperators,
    placeholder: "Business mobile",
  },
];

export const reportFilterSections = [
  {
    id: "period",
    label: "Report Period",
    type: "select",
    field: "__period__",
    options: [
      { value: "all", label: "All" },
      { value: "7d", label: "Last 7 days" },
      { value: "30d", label: "Last 30 days" },
      { value: "90d", label: "Last 90 days" },
    ],
  },
  {
    id: "merchant",
    label: "Merchant",
    type: "select-text",
    field: "__merchant__",
    operators: textOperators,
    placeholder: "Type merchant",
  },
  {
    id: "dateRange",
    label: "Last Modified",
    type: "range",
    field: "__range__",
    min: 0,
    max: 100,
    defaultValue: [20, 50],
  },
];
