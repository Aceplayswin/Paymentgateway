import { useCallback, useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import { fetchPayoutTransactions } from "../../Api";
import { getUserRole } from "../../utils/authStorage";
import { buildFilterSections } from "../../utils/filterUtils";
import { showServerErrorToast } from "../../utils/toast";

function Transactions() {
  const isHoldingAdminRole = getUserRole() === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchPayoutTransactions();
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setRows([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const tableColumns = [
    { key: "payoutId", label: "Payout ID" },
    isHoldingAdminRole ? { key: "merchant", label: "Merchant" } : null,
    { key: "beneficiaryName", label: "Beneficiary Name" },
    { key: "bankDetails", label: "Bank Details" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status", type: "badge" },
    { key: "timestamp", label: "Timestamp" },
  ].filter(Boolean);

  return (
    <section>
      <header className="content-header">
        <div>
          <h1>Payout Transactions</h1>
          <p>Beneficiary payouts with bulk operations and export-ready records.</p>
        </div>
      </header>
      {loading ? (
        <p className="table-empty">Loading payout transactions...</p>
      ) : (
        <DataTable
          title="Payout Transactions"
          rows={rows}
          columns={tableColumns}
          searchableKeys={["payoutId", "beneficiaryName", "bankDetails", "status", "merchant"]}
          filterSections={buildFilterSections({
            filterKey: "status",
            filterOptions: [
              { value: "processed", label: "Processed" },
              { value: "pending", label: "Pending" },
              { value: "processing", label: "Processing" },
              { value: "failed", label: "Failed" },
            ],
            extraSections: isHoldingAdminRole
              ? [
                  {
                    id: "merchant",
                    label: "Merchant",
                    type: "select-text",
                    field: "merchant",
                    operators: [
                      { value: "contains", label: "Contains" },
                      { value: "equals", label: "Equals" },
                    ],
                    placeholder: "Type merchant",
                  },
                ]
              : [],
          })}
        />
      )}
    </section>
  );
}

export default Transactions;
