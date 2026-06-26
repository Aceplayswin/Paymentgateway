import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      question: "How quickly are settlements processed?",
      answer: "Settlement timing depends on your plan, banking partner, and configured payout schedule."
    },
    {
      question: "Which payment methods are supported?",
      answer: "Paygate supports UPI, cards, net banking, wallets, and major international payment methods."
    },
    {
      question: "Do you support international payments?",
      answer: "Yes. Paygate supports cross-border payments, multi-currency flows, and global settlement operations."
    },
    {
      question: "Is the platform PCI DSS compliant?",
      answer: "The landing page presents PCI DSS compliance as a trust capability for enterprise payment operations."
    },
    {
      question: "Can payouts be automated?",
      answer: "Yes. Businesses can automate vendor payouts, salary transfers, and bulk disbursements."
    },
    {
      question: "Are APIs available?",
      answer: "Yes. REST APIs, webhooks, SDK-ready integration paths, and sandbox workflows are highlighted for developers."
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const toggle = (idx) => {
    setActiveIndex(activeIndex === idx ? -1 : idx);
  };

  return (
    <section className="section-pad muted-section">
      <div className="layout">
        <div className="section-heading centered reveal visible">
          <p className="eyebrow">FAQ</p>
          <h2>Answers before you start.</h2>
        </div>
        <div className="faq-list reveal visible">
          {faqs.map((faq, idx) => {
            const isOpen = activeIndex === idx;
            return (
              <div 
                className={`faq-item-wrapper ${isOpen ? "open" : ""}`} 
                key={idx}
              >
                <button 
                  className="faq-question-btn" 
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown className="faq-chevron" size={18} />
                </button>
                <div className="faq-answer-container">
                  <div className="faq-answer-content">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
