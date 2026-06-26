import React from "react";

export default function Methods() {
  const indiaMethods = ["UPI", "RuPay", "Net Banking", "Wallets", "Credit Cards", "Debit Cards"];
  const intlMethods = ["Visa", "Mastercard", "American Express", "Apple Pay", "Google Pay", "Bank Transfers"];

  return (
    <section className="section-pad">
      <div className="layout">
        <div className="section-heading centered reveal visible">
          <p className="eyebrow">Payment methods</p>
          <h2>Local depth. International reach.</h2>
        </div>
        <div className="method-grid">
          <article className="method-card reveal visible">
            <h3>India</h3>
            <p className="method-desc">Optimized checkout experience for Indian consumers</p>
            <div className="tag-cloud">
              {indiaMethods.map((m, i) => (
                <span key={i} className="method-tag">{m}</span>
              ))}
            </div>
            <div className="card-hover-border"></div>
          </article>
          <article className="method-card reveal visible">
            <h3>International</h3>
            <p className="method-desc">Multi-currency conversion with zero friction</p>
            <div className="tag-cloud">
              {intlMethods.map((m, i) => (
                <span key={i} className="method-tag">{m}</span>
              ))}
            </div>
            <div className="card-hover-border"></div>
          </article>
        </div>
      </div>
    </section>
  );
}
