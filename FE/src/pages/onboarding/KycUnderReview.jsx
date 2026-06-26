import { useEffect, useState } from "react";
import { FiArrowLeft, FiDownload, FiShield } from "react-icons/fi";
import { Navigate, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  getUserEmail,
  getUserRole,
  isAuthenticated,
} from "../../utils/authStorage";
import { downloadKycSummaryPdf } from "../../utils/kycPrint";
import {
  getMerchantOnboarding,
  KYC_STATUS,
  ONBOARDING_CHANGED_EVENT,
} from "../../utils/onboardingStorage";
import { showServerErrorToast, showServerSuccessToast } from "../../utils/toast";

function KycUnderReview() {
  const navigate = useNavigate();
  const email = getUserEmail();
  const [record, setRecord] = useState(() => getMerchantOnboarding(email));

  useEffect(() => {
    const refreshRecord = () => {
      setRecord(getMerchantOnboarding(email));
    };

    refreshRecord();
    window.addEventListener(ONBOARDING_CHANGED_EVENT, refreshRecord);
    window.addEventListener("storage", refreshRecord);

    return () => {
      window.removeEventListener(ONBOARDING_CHANGED_EVENT, refreshRecord);
      window.removeEventListener("storage", refreshRecord);
    };
  }, [email]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (getUserRole() !== "merchant") {
    return <Navigate to="/dashboard/admin" replace />;
  }

  if (!record || record.kycStatus !== KYC_STATUS.SUBMITTED) {
    return <Navigate to="/dashboard/merchant" replace />;
  }

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const handleDownloadPdf = async () => {
    if (!record.kycData) {
      return;
    }

    try {
      await downloadKycSummaryPdf(record.kycData, email);
      showServerSuccessToast("KYC summary downloaded as PDF.");
    } catch {
      showServerErrorToast("Could not generate the KYC PDF. Please try again.");
    }
  };

  const submittedDate = record.kycSubmittedAt
    ? new Date(record.kycSubmittedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Recently";

  return (
    <main className="auth-page">
      <div className="bg-shape shape-1" />
      <div className="bg-shape shape-2" />
      <div className="bg-shape shape-3" />

      <section className="auth-card status-page-card kyc-under-review-card" aria-label="KYC under review">
        <header className="kyc-under-review-header">
          <span className="kyc-under-review-eyebrow">Verification Status</span>
          <div className="kyc-under-review-icon" aria-hidden="true">
            <FiShield />
          </div>
          <h1>KYC Under Review</h1>
          <p className="kyc-under-review-submitted">Submitted on {submittedDate}</p>
        </header>

        <p className="kyc-under-review-message">
          Your documents are being verified by our compliance team. Full dashboard access will be
          enabled once verification is complete.
        </p>

        <div className="kyc-under-review-progress">
          <h2>Verification Progress</h2>
          <ul className="kyc-under-review-timeline">
            <li className="kyc-under-review-timeline-item is-done">
              <span className="kyc-under-review-timeline-marker" aria-hidden="true" />
              <span>Account approved</span>
            </li>
            <li className="kyc-under-review-timeline-item is-done">
              <span className="kyc-under-review-timeline-marker" aria-hidden="true" />
              <span>KYC documents submitted</span>
            </li>
            <li className="kyc-under-review-timeline-item is-active">
              <span className="kyc-under-review-timeline-marker" aria-hidden="true" />
              <span>Document verification in progress</span>
            </li>
            <li className="kyc-under-review-timeline-item">
              <span className="kyc-under-review-timeline-marker" aria-hidden="true" />
              <span>Full dashboard access</span>
            </li>
          </ul>
        </div>

        <p className="kyc-under-review-notice">
          We will notify you at <strong>{email}</strong> when your KYC is approved. Review
          typically takes 1–2 business days.
        </p>

        <div className="kyc-under-review-actions">
          {record.kycData ? (
            <button type="button" className="secondary-btn" onClick={handleDownloadPdf}>
              <FiDownload aria-hidden="true" />
              Download KYC PDF
            </button>
          ) : null}
          <button type="button" className="kyc-under-review-login-btn" onClick={handleLogout}>
            <FiArrowLeft aria-hidden="true" />
            Back to Login
          </button>
        </div>
      </section>
    </main>
  );
}

export default KycUnderReview;
