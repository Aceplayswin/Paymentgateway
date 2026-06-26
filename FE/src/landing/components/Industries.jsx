import React from "react";

export default function Industries() {
  const industries = [
    "E-commerce",
    "SaaS",
    "Fintech",
    "Marketplaces",
    "Travel",
    "Education",
    "Subscription Businesses",
    "Agencies",
    "Enterprises",
    "Export Businesses"
  ];

  return (
    <section className="section-pad">
      <div className="layout">
        <div className="section-heading centered reveal visible">
          <p className="eyebrow">Industries</p>
          <h2>Built for Every Business</h2>
        </div>
        <div className="industry-grid">
          {industries.map((ind, idx) => (
            <span key={idx} className="industry-tag">
              <span className="industry-dot"></span>
              {ind}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
