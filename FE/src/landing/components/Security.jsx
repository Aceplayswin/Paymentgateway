import React from "react";
import { Shield, ShieldCheck } from "lucide-react";

export default function Security() {
  const securityBadges = [
    "PCI DSS Compliance",
    "SSL Encryption",
    "Tokenization",
    "Fraud Detection",
    "Risk Monitoring",
    "IP Whitelisting",
    "Secure Authentication",
    "Data Protection"
  ];

  return (
    <section className="section-pad" id="security">
      <div className="layout">
        <div className="section-heading centered reveal visible">
          <p className="eyebrow">Enterprise security</p>
          <h2>Security at Every Layer</h2>
        </div>
        <div className="security-grid">
          <article className="security-illustration reveal visible">
            <div className="shield-container">
              <div className="shield-ambient-glow"></div>
              <div className="shield-3d">
                <ShieldCheck className="shield-icon" size={64} />
              </div>
            </div>
            <h3>Bank-grade controls for payment infrastructure.</h3>
            <p>Risk checks, identity-aware access, tokenized data, and monitored payment flows.</p>
          </article>
          
          <div className="security-card-wrap">
            <div className="security-cards">
              {securityBadges.map((badge, idx) => (
                <span key={idx} className="security-tag">
                  <span className="security-tag-check">✓</span>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
