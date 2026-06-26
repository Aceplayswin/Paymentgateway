import { useEffect, useState } from "react";
import { FiArrowLeft, FiCheck, FiX } from "react-icons/fi";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import KycReviewSummary from "../../components/kyc/KycReviewSummary";
import { getUserRole } from "../../utils/authStorage";
import { approveMerchantKyc, fetchMerchantKyc, rejectMerchantKyc } from "../../services/kyc";
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

function AdminKycDetailPage() {
  const navigate = useNavigate();
  const { email: encodedMerchantId } = useParams();
  const merchantId = decodeURIComponent(encodedMerchantId || "");
  const { refresh: refreshNotifications } = useAdminNotifications();
  const [actionLoading, setActionLoading] = useState(false);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const refreshRecord = async () => {
      setLoading(true);
      try {
        const response = await fetchMerchantKyc(merchantId);
        if (!cancelled) {
          const kyc = response?.data?.kyc || null;
          const request = response?.data?.request || {};
          const merchant = kyc?.merchant || {};
          setRecord({
            merchantId: merchant.id ?? request.merchantId ?? null,
            email: merchant.email || request.email || "",
            firstName: merchant.firstName || "",
            lastName: merchant.lastName || "",
            kycData: kyc?.kycData || null,
            kycSubmittedAt: kyc?.kycSubmittedAt || request.submittedAt || null,
            userKycStatus: kyc?.userKycStatus || request.userKycStatus || "",
          });
        }
      } catch {
        if (!cancelled) {
          setRecord(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    refreshRecord();
    return () => {
      cancelled = true;
    };
  }, [merchantId]);

  if (getUserRole() !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <section>
        <header className="content-header">
          <div>
            <h1>KYC Details</h1>
            <p>Loading KYC submission...</p>
          </div>
        </header>
      </section>
    );
  }

  if (!record || !record.kycData) {
    return (
      <section>
        <header className="content-header">
          <div>
            <h1>KYC Details</h1>
            <p>No KYC submission found for this merchant.</p>
          </div>
        </header>
        <Link to="/merchant/kyc-requests" className="kyc-btn kyc-btn--ghost">
          <FiArrowLeft aria-hidden="true" />
          Back to KYC Requests
        </Link>
      </section>
    );
  }

  const merchantName =
    `${record.firstName || ""} ${record.lastName || ""}`.trim() || record.email || "Merchant";
  const isPending = record.userKycStatus === "submitted";

  if (!isPending) {
    return <Navigate to="/merchant/kyc-requests" replace />;
  }

  const handleApprove = async () => {
    if (actionLoading || !isPending) {
      return;
    }

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
      refreshNotifications();
      navigate("/merchant/kyc-requests");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (actionLoading || !isPending) {
      return;
    }

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
      refreshNotifications();
      navigate("/merchant/kyc-requests");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="admin-kyc-detail">
      <header className="content-header">
        <div>
          <p className="admin-kyc-detail__eyebrow">Merchant KYC Review</p>
          <h1>{merchantName}</h1>
          <p>
            {record.email}
            {record.kycSubmittedAt
              ? ` · Submitted ${new Date(record.kycSubmittedAt).toLocaleString()}`
              : ""}
          </p>
        </div>
        <Link to="/merchant/kyc-requests" className="kyc-btn kyc-btn--ghost">
          <FiArrowLeft aria-hidden="true" />
          Back
        </Link>
      </header>

      <div className="admin-kyc-detail__card">
        <KycReviewSummary
          formData={record.kycData}
          email={record.email}
          readOnly
          showToolbar
          bannerTitle="Merchant KYC Details"
          bannerDescription="Review all submitted personal, business, document, and bank information before approving or rejecting this merchant."
        />
      </div>

      {isPending ? (
        <div className="admin-kyc-detail__actions">
          <button
            type="button"
            className="kyc-btn kyc-btn--ghost admin-kyc-detail__reject"
            onClick={handleReject}
            disabled={actionLoading}
          >
            <FiX aria-hidden="true" />
            Reject KYC
          </button>
          <button
            type="button"
            className="kyc-btn kyc-btn--submit"
            onClick={handleApprove}
            disabled={actionLoading}
          >
            <FiCheck aria-hidden="true" />
            Approve KYC
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default AdminKycDetailPage;
