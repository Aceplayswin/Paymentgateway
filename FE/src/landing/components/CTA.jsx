import React from "react";
import { Link } from "react-router-dom";
import { getDashboardPath, isAuthenticated } from "../../utils/authStorage";

export default function CTA() {
  const loggedIn = isAuthenticated();
  const dashboardPath = loggedIn ? getDashboardPath() : null;

  return (
    <section className="final-cta section-pad">
      <div className="layout cta-panel reveal visible">
        <div className="cta-content">
          <h2>Start Accepting Payments Globally Today</h2>
          <p>
            Join businesses that trust our secure payment infrastructure to process payments, automate payouts, and grow
            faster.
          </p>
        </div>
        <div className="hero-actions">
          {loggedIn ? (
            <Link className="btn btn-light" to={dashboardPath}>Go to Dashboard</Link>
          ) : (
            <>
              <Link className="btn btn-light" to="/register">Create Account</Link>
              <Link className="btn btn-ghost-light" to="/login">Login Dashboard</Link>
            </>
          )}
          <a className="btn btn-ghost-light" href="mailto:sales@paygate.com">Schedule Demo</a>
        </div>
        
        {/* Glow effect blobs inside panel */}
        <div className="cta-glow-1"></div>
        <div className="cta-glow-2"></div>
      </div>
    </section>
  );
}
