import React from "react";

export default function Solutions() {
  const pins = [
    { name: "India", className: "pin-india" },
    { name: "UAE", className: "pin-uae" },
    { name: "Singapore", className: "pin-sg" },
    { name: "United States", className: "pin-us" },
    { name: "United Kingdom", className: "pin-uk" },
    { name: "Europe", className: "pin-eu" },
    { name: "Australia", className: "pin-au" }
  ];

  return (
    <section className="section-pad muted-section" id="solutions">
      <div className="layout split-grid">
        <div className="reveal visible">
          <div className="section-heading">
            <p className="eyebrow">Global coverage</p>
            <h2>Accept Payments Across Borders</h2>
            <p>
              Launch in India and expand internationally with multi-currency collection, global settlements, and
              compliant merchant onboarding.
            </p>
          </div>
          <div className="coverage-list">
            <span>Multi-Currency Support</span>
            <span>Cross-Border Payments</span>
            <span>Global Settlements</span>
            <span>International Merchant Onboarding</span>
          </div>
        </div>
        <div className="world-card reveal visible">
          <div className="world-map-container">
            <svg viewBox="0 0 720 360" role="img" aria-label="World map coverage">
              <path d="M77 156l52-31 54 14 18 38-26 38-59 10-45-27zM250 104l96-36 91 17 42 55-31 76-93 28-97-34-35-57zM458 75l72-24 70 21 48 52-13 49-71 18-63-31-55-32zM520 232l68 6 54 38-28 46-78 1-47-37zM338 263l65-14 54 27-13 42-78 11-49-23zM154 248l74 4 42 33-31 44-84-2-39-35z" />
            </svg>
            {pins.map((pin, index) => (
              <span key={index} className={`pin ${pin.className}`}>
                <span className="pin-pulse"></span>
                <span className="pin-text">{pin.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
