import { useCallback, useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import DataTable from "../../components/DataTable";
import { fetchPayoutLedger } from "../../Api";
import { getUserRole } from "../../utils/authStorage";
import { showServerErrorToast } from "../../utils/toast";

function Ledger() {
  const isHoldingAdminRole = getUserRole() === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLedger = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchPayoutLedger();
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setRows([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const tableColumns = [
    { key: "entryId", label: "Entry ID" },
    isHoldingAdminRole ? { key: "merchant", label: "Merchant" } : null,
    { key: "type", label: "Debit / Credit", type: "badge" },
    { key: "balance", label: "Balance" },
    { key: "referenceId", label: "Reference ID" },
    { key: "timestamp", label: "Timestamp" },
  ].filter(Boolean);

  return (
    <section>
      <header className="content-header content-header--with-actions">
        <div>
          <h1>Ledger</h1>
          <p>Track debit and credit entries with reference and balance snapshots.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="outline-btn">
            <FiDownload />
            Download Ledger
          </button>
        </div>
      </header>
      {loading ? (
        <p className="table-empty">Loading ledger entries...</p>
      ) : (
        <DataTable
          title="Ledger Entries"
          rows={rows}
          columns={tableColumns}
          searchableKeys={["entryId", "type", "referenceId", "timestamp", "merchant"]}
          filterKey="type"
          filterOptions={[
            { value: "credit", label: "Credit" },
            { value: "debit", label: "Debit" },
          ]}
        />
      )}
    </section>
  );
}

export default Ledger;
