import { useCallback, useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";
import TableToolbar from "../../components/TableToolbar";
import { useAdminNotifications } from "../../context/AdminNotificationContext";
import {
  approveMerchant,
  fetchPendingMerchantRequests,
  rejectMerchant,
} from "../../services/merchantAdmin";
import { newRequestFilterSections } from "../../utils/filterPresets";
import { approveMerchantAccount } from "../../utils/onboardingStorage";
import {
  clearDismissedNotification,
  dismissAdminNotification,
  NOTIFICATION_TYPES,
} from "../../utils/notificationStorage";
import {
  closeSweetAlert,
  confirmApproveMerchant,
  confirmRejectMerchant,
  showActionLoading,
  showActionSuccess,
} from "../../utils/sweetAlert";
import { showServerErrorToast } from "../../utils/toast";

const NEW_REQUEST_SEARCHABLE_KEYS = ["merchantCode", "username", "email", "phoneNumber"];
const PAGE_SIZE = 8;

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

function NewRequest() {
  const { refresh: refreshNotifications } = useAdminNotifications();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filteredRows, setFilteredRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchPendingMerchantRequests();
      setRows(response.data?.pendingRequests || []);
    } catch (error) {
      setRows([]);
      setErrorMessage(error.data?.message || "Unable to load merchant requests.");
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilteredRowsChange = useCallback((nextRows) => {
    setFilteredRows(nextRows);
    setPage(1);
  }, []);

  const handleApprove = async (row) => {
    if (actionLoading) {
      return;
    }

    const merchantName = formatName(row);
    const confirmed = await confirmApproveMerchant(merchantName);

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    showActionLoading("Approving merchant...");

    try {
      const response = await approveMerchant(row.merchantId);
      approveMerchantAccount(row.email);
      dismissAdminNotification(`${NOTIFICATION_TYPES.MERCHANT_REQUEST}-${row.email}`);
      closeSweetAlert();
      await showActionSuccess("Merchant Approved", response.message || "Merchant approved successfully.");
      await loadRequests();
      refreshNotifications();
    } catch (error) {
      closeSweetAlert();
      showServerErrorToast(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (row) => {
    if (actionLoading) {
      return;
    }

    const merchantName = formatName(row);
    const { confirmed, reason } = await confirmRejectMerchant(merchantName);

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    showActionLoading("Rejecting merchant...");

    try {
      const response = await rejectMerchant(row.merchantId, reason);
      const notificationId = `${NOTIFICATION_TYPES.MERCHANT_REQUEST}-${row.email}`;
      dismissAdminNotification(notificationId);
      clearDismissedNotification(notificationId);
      closeSweetAlert();
      await showActionSuccess("Merchant Rejected", response.message || "Merchant rejected successfully.");
      await loadRequests();
      refreshNotifications();
    } catch (error) {
      closeSweetAlert();
      showServerErrorToast(error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section>
      <header className="content-header">
        <div>
          <h1>New Request</h1>
          <p>Review new merchant account applications and approve or reject them.</p>
        </div>
      </header>

      <TableToolbar
          title="Pending Merchant Requests"
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search requests..."
          filterSections={newRequestFilterSections}
          rows={rows}
          searchableKeys={NEW_REQUEST_SEARCHABLE_KEYS}
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
                <th>Requested At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="table-empty">
                    Loading merchant requests...
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td colSpan={8} className="table-empty">
                    {errorMessage}
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-empty">
                    No pending merchant requests found.
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
                    <td>{formatDate(row.approvalRequestedAt || row.createdAt)}</td>
                    <td>
                      <Badge status={row.approvalStatus || "pending"} />
                    </td>
                    <td>
                      <div className="merchant-actions">
                        <button
                          type="button"
                          className="merchant-action-btn merchant-action-btn--view"
                          onClick={() => setSelectedMerchant(row)}
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

        {!loading && filteredRows.length > 0 ? (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        ) : null}
      </TableToolbar>

      {selectedMerchant ? (
        <div className="admin-detail-modal" role="dialog" aria-modal="true" aria-label="Merchant details">
          <div className="admin-detail-modal__card">
            <header className="admin-detail-modal__header">
              <div>
                <h2>{formatName(selectedMerchant)}</h2>
                <p>{selectedMerchant.email}</p>
              </div>
              <button
                type="button"
                className="admin-detail-modal__close"
                onClick={() => setSelectedMerchant(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </header>
            <dl className="admin-detail-modal__list">
              <div>
                <dt>Merchant Code</dt>
                <dd>{selectedMerchant.merchantCode || "—"}</dd>
              </div>
              <div>
                <dt>Username</dt>
                <dd>{selectedMerchant.username || "—"}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{selectedMerchant.phoneNumber || "—"}</dd>
              </div>
              <div>
                <dt>Requested At</dt>
                <dd>{formatDate(selectedMerchant.approvalRequestedAt || selectedMerchant.createdAt)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{selectedMerchant.approvalStatus || "pending"}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default NewRequest;
