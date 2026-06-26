import React from "react";
import { Link } from "react-router-dom";
import { getDashboardPath, isAuthenticated } from "../../utils/authStorage";

export default function Hero() {
  const loggedIn = isAuthenticated();
  const dashboardPath = loggedIn ? getDashboardPath() : null;

  return (
    <section className="hero" id="home">
      <div className="hero-backdrop" aria-hidden="true"></div>
      
      {/* Animated ambient glowing blobs */}
      <div className="glowing-blob blob-1"></div>
      <div className="glowing-blob blob-2"></div>

      <div className="hero-grid layout">
        <div className="hero-copy reveal visible">
          <p className="eyebrow eyebrow-pill">Enterprise payment infrastructure</p>
          <h1>
            One Platform for <span className="text-gradient">Payments, Payouts</span> &amp; Global Growth
          </h1>
          <p className="hero-subtitle">
            Accept payments, automate payouts, manage settlements, and scale across India and international markets
            with secure, enterprise-grade infrastructure.
          </p>
          <div className="hero-actions">
            {loggedIn ? (
              <Link className="btn btn-primary btn-large" to={dashboardPath}>Go to Dashboard</Link>
            ) : (
              <>
                <Link className="btn btn-primary btn-large" to="/register">Get Started Free</Link>
                <Link className="btn btn-secondary btn-large" to="/login">Login Dashboard</Link>
              </>
            )}
          </div>
          <div className="trust-badges trust-badges--hero" aria-label="Trust badges">
            <span>PCI DSS Compliant</span>
            <span>SSL Secured</span>
            <span>Fraud Protection</span>
            <span>Real-Time Monitoring</span>
            <span>99.99% Uptime</span>
          </div>
          <div className="hero-stats" aria-label="Platform highlights">
            <article>
              <strong>100K+</strong>
              <span>Daily transactions</span>
            </article>
            <article>
              <strong>50+</strong>
              <span>Countries supported</span>
            </article>
            <article>
              <strong>&lt;2s</strong>
              <span>Avg. checkout time</span>
            </article>
          </div>
        </div>

        <div className="hero-visual reveal visible" aria-label="Paygate dashboard preview">
          {/* Subtle floating glow rings */}
          <div className="dashboard-orbit orbit-one"></div>
          <div className="dashboard-orbit orbit-two"></div>
          
          <span className="hero-float-chip chip-upi">UPI · Live</span>
          <span className="hero-float-chip chip-settle">T+1 Settlement</span>

          <div className="mock-dashboard mock-dashboard--hero floating-card">
            <div className="mock-topbar">
              <div className="mock-dots">
                <span className="mock-dot" style={{ backgroundColor: "#ef4444" }}></span>
                <span className="mock-dot" style={{ backgroundColor: "#f59e0b" }}></span>
                <span className="mock-dot" style={{ backgroundColor: "#10b981" }}></span>
              </div>
              <strong>Merchant Console</strong>
              <div className="mock-status-pill">
                <span className="pulse-indicator"></span> Live
              </div>
            </div>

            <div className="revenue-panel revenue-panel--compact">
              <div className="revenue-meta">
                <span>Total Revenue</span>
                <em className="revenue-growth">+18.6%</em>
              </div>
              <strong>₹8.42 Cr</strong>
            </div>

            <div className="dashboard-grid dashboard-grid--compact">
              <article className="mini-card mini-card--compact">
                <span>Transactions</span>
                <strong>42,918</strong>
                <div className="spark spark-blue">
                  <svg viewBox="0 0 100 30" className="sparkline-svg">
                    <defs>
                      <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,25 Q15,10 30,18 T60,5 T90,12 L100,8 L100,30 L0,30 Z"
                      fill="url(#sparkline-grad)"
                    />
                    <path
                      d="M0,25 Q15,10 30,18 T60,5 T90,12 L100,8"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="animated-path"
                    />
                  </svg>
                </div>
              </article>

              <article className="mini-card mini-card--compact">
                <span>Settlements</span>
                <strong>₹2.16 Cr</strong>
                <div className="progress-container">
                  <div className="progress"><i className="animated-progress-bar" style={{ width: "78%" }}></i></div>
                  <small>78% processed</small>
                </div>
              </article>

              <article className="mini-card mini-card--compact">
                <span>Payouts</span>
                <strong>98.8%</strong>
                <div className="success-rate-indicator">
                  <div className="pulse-glow-green"></div>
                  <small>Success rate</small>
                </div>
              </article>

              <article className="mini-card mini-card--compact">
                <span>Merchants</span>
                <strong>5,204</strong>
                <div className="bar-set bar-set--compact">
                  <i className="bar-1"></i>
                  <i className="bar-2"></i>
                  <i className="bar-3"></i>
                  <i className="bar-4"></i>
                  <i className="bar-5"></i>
                </div>
              </article>
            </div>

            <div className="activity-feed activity-feed--compact">
              <div className="feed-item">
                <span className="status success"></span>
                <span>UPI captured <b>₹24,900</b></span>
                <span className="feed-time">Just now</span>
              </div>
              <div className="feed-item">
                <span className="status success"></span>
                <span>Payout done <b>₹8.2L</b></span>
                <span className="feed-time">1m ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
