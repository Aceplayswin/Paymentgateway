import React from "react";
import { Link } from "react-router-dom";

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "2.0%",
      desc: "For new businesses launching payment collection.",
      features: [
        "Standard transaction fees",
        "API access",
        "Basic settlements",
        "Email support",
        "Payin features"
      ],
      ctaText: "Start Free Trial",
      ctaLink: "/register",
      featured: false
    },
    {
      name: "Business",
      price: "Custom",
      desc: "For growing teams running payins and payouts.",
      features: [
        "Volume pricing",
        "Advanced API access",
        "Settlement tracking",
        "Priority support",
        "Payout automation"
      ],
      ctaText: "Start Free Trial",
      ctaLink: "/register",
      featured: true
    },
    {
      name: "Enterprise",
      price: "Tailored",
      desc: "For platforms, banks, and high-scale merchants.",
      features: [
        "Negotiated fees",
        "Dedicated API support",
        "Custom settlements",
        "24/7 support",
        "Advanced risk controls"
      ],
      ctaText: "Start Free Trial",
      ctaLink: "#contact",
      featured: false
    }
  ];

  return (
    <section className="section-pad" id="pricing">
      <div className="layout">
        <div className="section-heading centered reveal visible">
          <p className="eyebrow">Pricing</p>
          <h2>Plans that scale with your business.</h2>
        </div>
        <div className="pricing-grid">
          {plans.map((plan, idx) => (
            <article 
              className={`pricing-card ${plan.featured ? "featured" : ""} reveal visible`} 
              key={idx}
            >
              {plan.featured && <span className="plan-badge">Popular</span>}
              <h3>{plan.name}</h3>
              <strong>{plan.price}</strong>
              <p>{plan.desc}</p>
              <ul>
                {plan.features.map((feat, fidx) => (
                  <li key={fidx}>{feat}</li>
                ))}
              </ul>
              {plan.ctaLink.startsWith("/") ? (
                <Link
                  className={`btn ${plan.featured ? "btn-primary" : "btn-secondary"}`}
                  to={plan.ctaLink}
                >
                  {plan.ctaText}
                </Link>
              ) : (
                <a
                  className={`btn ${plan.featured ? "btn-primary" : "btn-secondary"}`}
                  href={plan.ctaLink}
                >
                  {plan.ctaText}
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
