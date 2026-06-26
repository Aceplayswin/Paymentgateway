import { useCallback, useMemo, useState } from "react";

const MERCHANT_MANAGER_SEARCHABLE_KEYS = [
  "merchantId",
  "merchantName",
  "businessType",
  "kycStatus",
  "merchantStatus",
  "email",
];
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";
import TableToolbar from "../../components/TableToolbar";
import { merchantManagerFilterSections } from "../../utils/filterPresets";
import { merchantManagerData } from "../../data/dashboardData";
import {
  ACCOUNT_STATUS,
  approveMerchantAccount,
  approveMerchantKyc,
  getAllMerchantOnboardingRecords,
  KYC_STATUS,
  onboardingRecordToManagerRow,
} from "../../utils/onboardingStorage";
import { confirmMerchantApproval } from "../../utils/sweetAlert";

const PAGE_SIZE = 8;

function MerchantManager() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filteredRows, setFilteredRows] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const rows = useMemo(() => {
    const onboardingRows = getAllMerchantOnboardingRecords().map(onboardingRecordToManagerRow);
    const mockRows = merchantManagerData.map((row) => ({
      ...row,
      isOnboardingRecord: false,
    }));
    return [...onboardingRows, ...mockRows];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilteredRowsChange = useCallback((nextRows) => {
    setFilteredRows(nextRows);
    setPage(1);
  }, []);

  const handleApproveAccount = async (row) => {
    const confirmed = await confirmMerchantApproval({
      title: "Approve Merchant Account",
      message: `Are you sure you want to approve <span class="swal-merchant-name">${row.merchantName}</span>'s merchant account?`,
      submessage: "They will be able to sign in and complete KYC.",
    });

    if (!confirmed) {
      return;
    }

    approveMerchantAccount(row.email);
    setRefreshKey((prev) => prev + 1);
  };

  const handleApproveKyc = async (row) => {
    const confirmed = await confirmMerchantApproval({
      title: "Approve KYC Verification",
      message: `Are you sure you want to approve <span class="swal-merchant-name">${row.merchantName}</span>'s KYC verification?`,
      submessage: "They will gain full dashboard access.",
    });

    if (!confirmed) {
      return;
    }

    approveMerchantKyc(row.email);
    setRefreshKey((prev) => prev + 1);
  };

  const renderActions = (row) => {
    if (!row.isOnboardingRecord) {
      return <span className="table-muted">—</span>;
    }

    const actions = [];

    if (row.accountStatus === ACCOUNT_STATUS.PENDING_REVIEW) {
      actions.push(
        <button
          key="approve-account"
          type="button"
          className="merchant-action-btn"
          onClick={() => handleApproveAccount(row)}
        >
          Approve Account
        </button>
      );
    }

    if (
      row.accountStatus === ACCOUNT_STATUS.APPROVED &&
      row.rawKycStatus === KYC_STATUS.SUBMITTED
    ) {
      actions.push(
        <button
          key="approve-kyc"
          type="button"
          className="merchant-action-btn approve-kyc"
          onClick={() => handleApproveKyc(row)}
        >
          Approve KYC
        </button>
      );
    }

    if (actions.length === 0) {
      return <span className="table-muted">No actions</span>;
    }

    return <div className="merchant-actions">{actions}</div>;
  };

  return (
    <section>
      <header className="content-header">
        <div>
          <h1>Merchant Manager</h1>
          <p>Monitor KYC, transaction volume, and merchant account health.</p>
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
          filterSections={merchantManagerFilterSections}
          rows={rows}
          searchableKeys={MERCHANT_MANAGER_SEARCHABLE_KEYS}
          onFilteredRowsChange={handleFilteredRowsChange}
        >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Merchant ID</th>
                <th>Merchant Name</th>
                <th>Business Type</th>
                <th>KYC Status</th>
                <th>Transaction Volume</th>
                <th>Merchant Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    No merchants found.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={`${row.merchantId}-${row.email || ""}`}>
                    <td>{row.merchantId}</td>
                    <td>{row.merchantName}</td>
                    <td>{row.businessType}</td>
                    <td>
                      <Badge status={row.kycStatus} />
                    </td>
                    <td>{row.transactionVolume}</td>
                    <td>
                      <Badge status={row.merchantStatus} />
                    </td>
                    <td>{renderActions(row)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </TableToolbar>

    </section>
  );
}

export default MerchantManager;
