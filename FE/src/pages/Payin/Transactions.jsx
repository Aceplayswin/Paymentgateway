import { useCallback, useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import { fetchPayinTransactions } from "../../Api";
import { getUserRole } from "../../utils/authStorage";
import { getTransactionFilterSections } from "../../utils/filterPresets";
import { showServerErrorToast } from "../../utils/toast";

function Transactions() {
  const isHoldingAdminRole = getUserRole() === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchPayinTransactions();
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
    { key: "transactionId", label: "Transaction ID" },
    { key: "orderId", label: "Order ID" },
    { key: "customer", label: "Customer Name" },
    isHoldingAdminRole ? { key: "merchant", label: "Merchant" } : null,
    { key: "amount", label: "Amount" },
    { key: "method", label: "Payment Method" },
    { key: "status", label: "Status", type: "badge" },
    { key: "timestamp", label: "Date & Time" },
  ].filter(Boolean);

  return (
    <section>
      <header className="content-header">
        <div>
          <h1>Payin Transactions</h1>
          <p>Track incoming payment flows by method, status, and date.</p>
        </div>
      </header>
      {loading ? (
        <p className="table-empty">Loading transactions...</p>
      ) : (
        <DataTable
          title={isHoldingAdminRole ? "Platform Payin Transactions" : "Payin Transactions"}
          rows={rows}
          columns={tableColumns}
          searchableKeys={["transactionId", "orderId", "customer", "merchant", "method", "status"]}
          filterSections={getTransactionFilterSections(isHoldingAdminRole)}
        />
      )}
    </section>
  );
}

export default Transactions;
