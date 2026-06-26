import { FiClock } from "react-icons/fi";
import { Navigate, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  getUserEmail,
  getUserRole,
  isAuthenticated,
} from "../../utils/authStorage";
import { ACCOUNT_STATUS, getMerchantOnboarding, syncMerchantOnboardingFromStoredAuth } from "../../utils/onboardingStorage";

function ApplicationUnderReview() {
  const navigate = useNavigate();
  const email = getUserEmail();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (getUserRole() !== "merchant") {
    return <Navigate to="/dashboard/admin" replace />;
  }

  syncMerchantOnboardingFromStoredAuth();
  const record = getMerchantOnboarding(email);

  if (!record || record.accountStatus !== ACCOUNT_STATUS.PENDING_REVIEW) {
    return <Navigate to="/dashboard/merchant" replace />;
  }

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <main className="auth-page">
      <div className="bg-shape shape-1" />
      <div className="bg-shape shape-2" />
      <div className="bg-shape shape-3" />

      <section className="auth-card status-page-card" aria-label="Application under review">
        <div className="status-icon-badge status-icon-warning">
          <FiClock aria-hidden="true" />
        </div>
        <h1>Application Under Review</h1>
        <p className="auth-subtitle">
          Thank you for registering with PayGate. Our compliance team is reviewing your merchant
          application. You will receive an email at <strong>{email}</strong> once your account is
          approved.
        </p>

        <ul className="status-timeline">
          <li className="status-timeline-item status-timeline-done">
            <span>Account created</span>
          </li>
          <li className="status-timeline-item status-timeline-active">
            <span>Application review in progress</span>
          </li>
        </ul>

        <p className="status-hint">
          Review typically takes 1–2 business days. Once approved, you can sign in and complete KYC
          verification from your merchant dashboard.
        </p>

        <button type="button" className="primary-btn" onClick={handleLogout}>
          Back to Login
        </button>
      </section>
    </main>
  );
}

export default ApplicationUnderReview;
