import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";
import TableToolbar from "../../components/TableToolbar";
import { fetchSubmittedKycRequests, approveMerchantKyc, rejectMerchantKyc } from "../../services/kyc";
import {
  clearDismissedNotification,
  dismissAdminNotification,
  NOTIFICATION_TYPES,
} from "../../utils/notificationStorage";
import {
  closeSweetAlert,
  confirmApproveKyc,
  confirmRejectKyc,
  showActionLoading,
  showActionSuccess,
} from "../../utils/sweetAlert";
import { showServerSuccessToast } from "../../utils/toast";
import { useAdminNotifications } from "../../context/AdminNotificationContext";

const PAGE_SIZE = 8;

function formatDate(value) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

function KycRequests() {
  const navigate = useNavigate();
  const { refresh: refreshNotifications } = useAdminNotifications();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRows = useCallback(async () => {
    try {
      const response = await fetchSubmittedKycRequests();
      setRows(response?.data?.requests || []);
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    loadRows();
    const handleRefresh = () => loadRows();
    window.addEventListener("storage", handleRefresh);
    window.addEventListener("paygate-notifications-changed", handleRefresh);
    return () => {
      window.removeEventListener("storage", handleRefresh);
      window.removeEventListener("paygate-notifications-changed", handleRefresh);
    };
  }, [loadRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilteredRowsChange = useCallback((nextRows) => {
    setFilteredRows(nextRows);
    setPage(1);
  }, []);

  const getMerchantDisplayName = (record) =>
    record.merchantName || `${record.firstName || ""} ${record.lastName || ""}`.trim() || record.email;

  const handleApprove = async (record) => {
    if (actionLoading) {
      return;
    }

    const merchantName = getMerchantDisplayName(record);
    const confirmed = await confirmApproveKyc(merchantName);
    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    showActionLoading("Approving KYC...");

    try {
      await approveMerchantKyc(record.merchantId);
      dismissAdminNotification(`${NOTIFICATION_TYPES.KYC_SUBMITTED}-${record.email}`);
      closeSweetAlert();
      await showActionSuccess("KYC Approved", `${merchantName} is now Fully verified.`);
      showServerSuccessToast("KYC approved successfully.");
      await loadRows();
      refreshNotifications();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (record) => {
    if (actionLoading) {
      return;
    }

    const merchantName = getMerchantDisplayName(record);
    const { confirmed, reason } = await confirmRejectKyc(merchantName);
    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    showActionLoading("Rejecting KYC...");

    try {
      await rejectMerchantKyc(record.merchantId, reason);
      const notificationId = `${NOTIFICATION_TYPES.KYC_SUBMITTED}-${record.email}`;
      dismissAdminNotification(notificationId);
      clearDismissedNotification(notificationId);
      closeSweetAlert();
      await showActionSuccess("KYC Rejected", `${merchantName} has been asked to resubmit KYC.`);
      await loadRows();
      refreshNotifications();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section>
      <header className="content-header">
        <div>
          <h1>KYC Requests</h1>
          <p>Review submitted merchant KYC details and approve or reject verification.</p>
        </div>
      </header>

      <TableToolbar
        title="Pending KYC Submissions"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search KYC requests..."
        rows={rows}
        searchableKeys={["merchantName", "email", "businessType"]}
        onFilteredRowsChange={handleFilteredRowsChange}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Merchant Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Business Type</th>
                <th>Submitted At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    No pending KYC submissions found.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={`${row.merchantId}-${row.email}`}>
                    <td>{getMerchantDisplayName(row)}</td>
                    <td>{row.email}</td>
                    <td>{row.phoneNumber || "—"}</td>
                    <td>{row.kycData?.business?.businessType || "—"}</td>
                    <td>{formatDate(row.submittedAt)}</td>
                    <td>
                      <Badge status="pending" />
                    </td>
                    <td>
                      <div className="merchant-actions">
                        <button
                          type="button"
                          className="merchant-action-btn merchant-action-btn--view"
                          onClick={() =>
                            navigate(`/merchant/kyc-review/${encodeURIComponent(row.merchantId)}`)
                          }
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className="merchant-action-btn merchant-action-btn--approve"
                          onClick={() => handleApprove(row)}
                          disabled={actionLoading}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="merchant-action-btn merchant-action-btn--reject"
                          onClick={() => handleReject(row)}
                          disabled={actionLoading}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredRows.length > 0 ? (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        ) : null}
      </TableToolbar>

      <p className="admin-request-hint">
        Need to review account signups? Go to{" "}
        <Link to="/merchant/new-request">New Request</Link>.
      </p>
    </section>
  );
}

export default KycRequests;
