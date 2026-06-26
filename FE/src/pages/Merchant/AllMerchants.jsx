import { useCallback, useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";
import TableToolbar from "../../components/TableToolbar";
import { merchantDirectoryFilterSections } from "../../utils/filterPresets";
import { fetchAllMerchants } from "../../services/merchantAdmin";
import { showServerErrorToast } from "../../utils/toast";

const PAGE_SIZE = 10;

const ALL_MERCHANTS_SEARCHABLE_KEYS = [
  "merchantCode",
  "username",
  "email",
  "phoneNumber",
  "approvalStatus",
];

function formatDate(value) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

function formatName(merchant) {
  const name = `${merchant.firstName || ""} ${merchant.lastName || ""}`.trim();
  return name || merchant.username || "—";
}

function getReviewDate(merchant) {
  if (merchant.approvalStatus === "approved") {
    return formatDate(merchant.approvedAt);
  }
  if (merchant.approvalStatus === "rejected") {
    return formatDate(merchant.rejectedAt);
  }
  return "—";
}

function AllMerchants() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filteredRows, setFilteredRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadMerchants = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchAllMerchants();
      const d = response.data || {};
      const all = [
        ...(d.approvedMerchants?.merchants || []),
        ...(d.pendingRequests?.requests || []),
        ...(d.rejectedMerchants?.merchants || []),
      ];
      setRows(all);
    } catch (error) {
      setRows([]);
      setErrorMessage(error.data?.message || "Unable to load merchants.");
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMerchants();
  }, [loadMerchants]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilteredRowsChange = useCallback((nextRows) => {
    setFilteredRows(nextRows);
    setPage(1);
  }, []);

  return (
    <section>
      <header className="content-header">
        <div>
          <h1>All Merchant</h1>
          <p>View all registered merchant accounts and their approval status.</p>
        </div>
      </header>

      <TableToolbar
          title="Merchant Directory"
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search merchants..."
          filterSections={merchantDirectoryFilterSections}
          rows={rows}
          searchableKeys={ALL_MERCHANTS_SEARCHABLE_KEYS}
          onFilteredRowsChange={handleFilteredRowsChange}
        >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Merchant Code</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Username</th>
                <th>Approval Status</th>
                <th>Requested At</th>
                <th>Approved / Rejected At</th>
                <th>Last Login</th>
                <th>Registered At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="table-empty">
                    Loading merchants...
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td colSpan={10} className="table-empty">
                    {errorMessage}
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="table-empty">
                    No merchants found.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.merchantId}>
                    <td>{row.merchantCode}</td>
                    <td>{formatName(row)}</td>
                    <td>{row.email}</td>
                    <td>{row.phoneNumber || "—"}</td>
                    <td>{row.username}</td>
                    <td>
                      <Badge status={row.approvalStatus || "pending"} />
                    </td>
                    <td>{formatDate(row.approvalRequestedAt)}</td>
                    <td>{getReviewDate(row)}</td>
                    <td>{formatDate(row.lastLogin)}</td>
                    <td>{formatDate(row.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredRows.length > 0 ? (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        ) : null}
      </TableToolbar>
    </section>
  );
}

export default AllMerchants;
