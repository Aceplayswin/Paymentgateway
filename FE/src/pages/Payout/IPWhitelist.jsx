import { useCallback, useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import { fetchPayoutIpWhitelist } from "../../Api";
import { showServerErrorToast } from "../../utils/toast";

function IPWhitelist() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadIpWhitelist = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchPayoutIpWhitelist();
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setRows([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIpWhitelist();
  }, [loadIpWhitelist]);

  return (
    <section>
      <header className="content-header content-header--with-actions">
        <div>
          <h1>IP Whitelist</h1>
          <p>Manage trusted payout API source IP addresses and access status.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="outline-btn">
            Add IP
          </button>
          <button type="button" className="outline-btn">
            Delete IP
          </button>
          <button type="button" className="outline-btn">
            Enable / Disable
          </button>
        </div>
      </header>
      {loading ? (
        <p className="table-empty">Loading IP whitelist...</p>
      ) : (
        <DataTable
          title="Allowed IP Addresses"
          rows={rows}
          columns={[
            { key: "ip", label: "Allowed IP" },
            { key: "status", label: "Status", type: "badge" },
            { key: "addedDate", label: "Added Date" },
          ]}
          searchableKeys={["ip", "status", "addedDate"]}
          filterKey="status"
          filterOptions={[
            { value: "enabled", label: "Enabled" },
            { value: "disabled", label: "Disabled" },
          ]}
        />
      )}
    </section>
  );
}

export default IPWhitelist;
