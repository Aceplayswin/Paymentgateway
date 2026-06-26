import React, { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      initials: "AM",
      quote:
        "Paygate gave us one reliable layer for collections, payouts, and settlements. Our finance team now has real-time clarity across every merchant flow.",
      name: "Ananya Mehta",
      role: "Head of Payments, UrbanCart",
    },
    {
      initials: "RK",
      quote:
        "The developer experience is clean, and the operations dashboard gives our teams the confidence to scale across India and international markets.",
      name: "Rahul Khanna",
      role: "Founder, Atlas SaaS",
    },
    {
      initials: "SP",
      quote:
        "Automated payouts and settlement tracking reduced manual reconciliation effort while improving visibility for our enterprise clients.",
      name: "Sara Patel",
      role: "VP Finance, GlobeTrade",
    },
  ];

  const [index, setIndex] = useState(0);

  const prev = () => {
    setIndex((index - 1 + testimonials.length) % testimonials.length);
  };

  const next = () => {
    setIndex((index + 1) % testimonials.length);
  };

  const current = testimonials[index];

  return (
    <section className="section-pad muted-section">
      <div className="layout">
        <div className="section-heading centered reveal visible">
          <p className="eyebrow">Customer proof</p>
          <h2>Trusted by teams that move money at scale.</h2>
        </div>
        <div className="testimonial-container-outer">
          <div className="testimonial-wrap reveal visible">
            <button className="carousel-btn" type="button" aria-label="Previous testimonial" onClick={prev}>
              <ArrowLeft size={18} />
            </button>
            
            <article className="testimonial-card fade-in" key={index} data-testimonial>
              <div className="avatar-img">{current.initials}</div>
              <p className="stars">★★★★★</p>
              <blockquote>
                "{current.quote}"
              </blockquote>
              <h3>{current.name}</h3>
              <span>{current.role}</span>
            </article>
            
            <button className="carousel-btn" type="button" aria-label="Next testimonial" onClick={next}>
              <ArrowRight size={18} />
            </button>
          </div>
          <div className="testimonial-dots">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                className={`testimonial-dot ${index === idx ? "active" : ""}`}
                onClick={() => setIndex(idx)}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
