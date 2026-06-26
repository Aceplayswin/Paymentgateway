import React, { useState, useEffect, useRef } from "react";

function CountUp({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime = null;
          const duration = 2000; // 2 seconds

          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            // Easing function: cubic ease-out
            const eased = 1 - Math.pow(1 - percentage, 3);
            
            setCount(Math.round(target * eased));

            if (progress < duration) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [target]);

  return (
    <strong ref={elementRef}>
      {count.toLocaleString()}{suffix}
    </strong>
  );
}

export default function Trust() {
  return (
    <section className="trust-section section-pad-sm">
      <div className="layout reveal visible">
        <div className="section-heading centered">
          <p className="eyebrow">Trusted by Businesses Worldwide</p>
          <h2>Built for fast-growing merchants, platforms, and enterprises.</h2>
        </div>
        
        <div className="logo-row" aria-label="Customer logos">
          <div className="logo-card"><span>Northstar</span></div>
          <div className="logo-card"><span>UrbanCart</span></div>
          <div className="logo-card"><span>Atlas SaaS</span></div>
          <div className="logo-card"><span>Finhub</span></div>
          <div className="logo-card"><span>GlobeTrade</span></div>
        </div>

        <div className="metric-grid">
          <article className="metric-card-interactive">
            <CountUp target={100} suffix="K+" />
            <span>Transactions Processed</span>
          </article>
          <article className="metric-card-interactive">
            <CountUp target={5000} suffix="+" />
            <span>Merchants</span>
          </article>
          <article className="metric-card-interactive">
            <strong>99.99%</strong>
            <span>Platform Uptime</span>
          </article>
          <article className="metric-card-interactive">
            <strong>24/7</strong>
            <span>Support Availability</span>
          </article>
        </div>
      </div>
    </section>
  );
}
