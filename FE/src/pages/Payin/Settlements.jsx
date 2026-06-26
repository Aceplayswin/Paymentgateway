import { useCallback, useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import { fetchPayinSettlements } from "../../Api";
import { getUserRole } from "../../utils/authStorage";
import { showServerErrorToast } from "../../utils/toast";

function Settlements() {
  const isHoldingAdminRole = getUserRole() === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSettlements = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchPayinSettlements();
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setRows([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  const tableColumns = [
    { key: "settlementId", label: "Settlement ID" },
    isHoldingAdminRole ? { key: "merchant", label: "Merchant" } : null,
    { key: "grossAmount", label: "Gross Amount" },
    { key: "fees", label: "Fees" },
    { key: "gst", label: "GST" },
    { key: "netSettlement", label: "Net Settlement" },
    { key: "settlementStatus", label: "Status", type: "badge" },
    { key: "settlementDate", label: "Settlement Date" },
  ].filter(Boolean);

  return (
    <section>
      <header className="content-header">
        <div>
          <h1>Settlements</h1>
          <p>Timeline-friendly settlement reconciliation with downloadable reports.</p>
        </div>
      </header>
      {loading ? (
        <p className="table-empty">Loading settlements...</p>
      ) : (
        <DataTable
          title="Settlement Records"
          rows={rows}
          columns={tableColumns}
          searchableKeys={["settlementId", "settlementStatus", "settlementDate", "merchant"]}
          filterKey="settlementStatus"
          filterOptions={[
            { value: "settled", label: "Settled" },
            { value: "processing", label: "Processing" },
            { value: "failed", label: "Failed" },
          ]}
        />
      )}
    </section>
  );
}

export default Settlements;
