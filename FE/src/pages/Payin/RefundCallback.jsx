import { useCallback, useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import { fetchRefundCallbacks } from "../../Api";
import { showServerErrorToast } from "../../utils/toast";

function RefundCallback() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCallbacks = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchRefundCallbacks();
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setRows([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCallbacks();
  }, [loadCallbacks]);

  return (
    <section>
      <header className="content-header">
        <div>
          <h1>Refund Callback</h1>
          <p>Track callback delivery logs and retry failed webhook notifications.</p>
        </div>
      </header>
      {loading ? (
        <p className="table-empty">Loading refund callbacks...</p>
      ) : (
        <DataTable
          title="Refund Callback Logs"
          rows={rows}
          columns={[
            { key: "refundId", label: "Refund ID" },
            { key: "callbackId", label: "Callback ID" },
            { key: "amount", label: "Amount" },
            { key: "status", label: "Status", type: "badge" },
            { key: "timestamp", label: "Timestamp" },
          ]}
          searchableKeys={["refundId", "callbackId", "status"]}
          filterKey="status"
          filterOptions={[
            { value: "success", label: "Success" },
            { value: "failed", label: "Failed" },
            { value: "pending", label: "Pending" },
          ]}
        />
      )}
    </section>
  );
}

export default RefundCallback;
