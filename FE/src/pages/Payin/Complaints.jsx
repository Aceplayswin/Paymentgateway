import { useCallback, useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import { fetchPayinComplaints } from "../../Api";
import { getUserRole } from "../../utils/authStorage";
import { showServerErrorToast } from "../../utils/toast";

function Complaints() {
  const isHoldingAdminRole = getUserRole() === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadComplaints = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchPayinComplaints();
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setRows([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const tableColumns = [
    { key: "complaintId", label: "Complaint ID" },
    isHoldingAdminRole ? { key: "merchant", label: "Merchant" } : null,
    { key: "issueType", label: "Issue Type" },
    { key: "priority", label: "Priority", type: "badge" },
    { key: "status", label: "Status", type: "badge" },
    { key: "timeline", label: "Timeline" },
  ].filter(Boolean);

  return (
    <section>
      <header className="content-header">
        <div>
          <h1>Complaints</h1>
          <p>Issue tracking with priority tags, status, and event timelines.</p>
        </div>
      </header>
      {loading ? (
        <p className="table-empty">Loading complaints...</p>
      ) : (
        <DataTable
          title="Complaint Tracker"
          rows={rows}
          columns={tableColumns}
          searchableKeys={["complaintId", "merchant", "issueType", "priority", "status"]}
          filterKey="status"
          filterOptions={[
            { value: "open", label: "Open" },
            { value: "investigating", label: "Investigating" },
            { value: "closed", label: "Closed" },
          ]}
        />
      )}
    </section>
  );
}

export default Complaints;
