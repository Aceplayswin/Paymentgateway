import React from "react";

export default function Analytics() {
  return (
    <section className="section-pad muted-section">
      <div className="layout split-grid">
        <div className="reveal visible">
          <div className="section-heading">
            <p className="eyebrow">Analytics</p>
            <h2>Real-Time Business Intelligence</h2>
            <p>
              Track revenue, transactions, success rate, settlement volume, payout volume, merchant growth, and
              conversion analytics in one operating view.
            </p>
          </div>
        </div>
        <div className="analytics-board reveal visible">
          <div className="analytics-main">
            <div className="analytics-header">
              <span>Revenue</span>
              <span className="analytics-label">Live update</span>
            </div>
            <strong>₹14.8 Cr</strong>
            <div className="area-chart-container">
              <svg viewBox="0 0 300 120" className="analytics-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line x1="0" y1="30" x2="300" y2="30" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="300" y2="90" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
                
                {/* Area path */}
                <path
                  d="M0,100 C40,90 80,105 120,70 C160,35 200,45 240,20 L300,10 L300,120 L0,120 Z"
                  fill="url(#area-grad)"
                />
                {/* Line path */}
                <path
                  d="M0,100 C40,90 80,105 120,70 C160,35 200,45 240,20 L300,10"
                  fill="none"
                  stroke="url(#line-grad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animated-path"
                />
                {/* Active Indicator dot */}
                <circle cx="300" cy="10" r="4" fill="#8b5cf6" />
                <circle cx="300" cy="10" r="8" fill="none" stroke="#8b5cf6" strokeWidth="1.5" className="ping-dot" />
              </svg>
            </div>
          </div>
          <div className="analytics-side">
            <span>Success Rate <b>98.9%</b></span>
            <span>Settlement Volume <b>₹7.6 Cr</b></span>
            <span>Payout Volume <b>₹3.1 Cr</b></span>
            <span>Merchant Growth <b>32%</b></span>
          </div>
        </div>
      </div>
    </section>
  );
}
