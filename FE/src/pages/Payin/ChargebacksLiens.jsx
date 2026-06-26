import { useCallback, useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import { fetchPayinChargebacksLiens } from "../../Api";
import { showServerErrorToast } from "../../utils/toast";

function ChargebacksLiens() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadChargebacksLiens = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchPayinChargebacksLiens();
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setRows([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChargebacksLiens();
  }, [loadChargebacksLiens]);

  return (
    <section>
      <header className="content-header">
        <div>
          <h1>Chargebacks & Liens</h1>
          <p>Dispute operations with priority tracking and evidence workflow.</p>
        </div>
      </header>
      {loading ? (
        <p className="table-empty">Loading chargebacks and liens...</p>
      ) : (
        <DataTable
          title="Dispute Queue"
          rows={rows}
          columns={[
            { key: "disputeId", label: "Dispute ID" },
            { key: "transactionId", label: "Transaction ID" },
            { key: "reason", label: "Reason" },
            { key: "status", label: "Status", type: "badge" },
            { key: "priority", label: "Priority", type: "badge" },
            { key: "notes", label: "Resolution Notes" },
          ]}
          searchableKeys={["disputeId", "transactionId", "reason", "status", "priority"]}
          filterKey="priority"
          filterOptions={[
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
        />
      )}
      <div className="inline-note">
        <p>Evidence Upload UI: Enabled in merchant workflow queue (frontend placeholder).</p>
      </div>
    </section>
  );
}

export default ChargebacksLiens;
