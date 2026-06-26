import React from "react";
import { 
  ArrowDownLeft, 
  Zap, 
  Layers, 
  Activity, 
  ShieldAlert, 
  LayoutDashboard 
} from "lucide-react";

export default function Features() {
  const featuresList = [
    {
      icon: <ArrowDownLeft className="feature-icon-svg" />,
      title: "Payin Management",
      description: "UPI Payments, Credit Cards, Debit Cards, Wallets, Net Banking, International Payments"
    },
    {
      icon: <Zap className="feature-icon-svg" />,
      title: "Payout Automation",
      description: "Instant Transfers, Vendor Payments, Salary Processing, Bulk Transfers"
    },
    {
      icon: <Layers className="feature-icon-svg" />,
      title: "Settlement Management",
      description: "Automated Settlements, Settlement Tracking, Reconciliation"
    },
    {
      icon: <Activity className="feature-icon-svg" />,
      title: "Transaction Monitoring",
      description: "Real-Time Tracking, Smart Reports, Status Monitoring"
    },
    {
      icon: <ShieldAlert className="feature-icon-svg" />,
      title: "Chargeback Management",
      description: "Dispute Handling, Complaint Tracking, Resolution Workflow"
    },
    {
      icon: <LayoutDashboard className="feature-icon-svg" />,
      title: "Merchant Dashboard",
      description: "Revenue Analytics, Balance Overview, Transaction Insights"
    }
  ];

  return (
    <section className="section-pad" id="features">
      <div className="layout">
        <div className="section-heading reveal visible">
          <p className="eyebrow">Unified platform</p>
          <h2>Everything your payment operations team needs.</h2>
          <p>
            Paygate brings collections, payouts, settlements, chargebacks, monitoring, and analytics into one
            premium operating layer.
          </p>
        </div>
        <div className="feature-grid">
          {featuresList.map((feat, idx) => (
            <article className="feature-card reveal visible" key={idx}>
              <div className="icon-pill-premium">
                {feat.icon}
              </div>
              <h3>{feat.title}</h3>
              <p>{feat.description}</p>
              <div className="card-hover-border"></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
