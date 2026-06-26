import { useNavigate } from "react-router-dom";

function KycOverlay() {
  const navigate = useNavigate();

  return (
    <div className="kyc-overlay" role="dialog" aria-modal="true" aria-label="KYC verification required">
      <div className="kyc-overlay-card">
        <h2>KYC Verification Required</h2>
        <p>
          Your merchant account has been approved. Complete identity and business verification to
          unlock full dashboard access and start accepting payments.
        </p>
        <ul className="kyc-overlay-checklist">
          <li>Personal &amp; business information</li>
          <li>Identity verification documents</li>
          <li>Bank account details</li>
          <li>Business registration documents</li>
        </ul>
        <button
          type="button"
          className="ds-primary-btn"
          onClick={() => navigate("/onboarding/kyc")}
        >
          Add Verification Details
        </button>
      </div>
    </div>
  );
}

export default KycOverlay;
