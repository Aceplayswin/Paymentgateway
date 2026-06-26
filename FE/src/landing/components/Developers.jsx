import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function Developers() {
  const [copied, setCopied] = useState(false);

  const codeSnippet = `const payment = await paygate.payins.create({
  amount: 24900,
  currency: "INR",
  customer: "merchant_customer_108",
  methods: ["upi", "card", "netbanking"],
  webhook_url: "https://merchant.app/webhooks"
});

return payment.checkout_url;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="section-pad muted-section" id="developers">
      <div className="layout split-grid">
        <div className="code-card reveal visible">
          <div className="code-header">
            <div className="mock-dots">
              <span className="mock-dot" style={{ backgroundColor: "#ef4444" }}></span>
              <span className="mock-dot" style={{ backgroundColor: "#f59e0b" }}></span>
              <span className="mock-dot" style={{ backgroundColor: "#10b981" }}></span>
            </div>
            <strong>paygate.js</strong>
            <button 
              className="copy-btn" 
              onClick={copyToClipboard}
              aria-label="Copy code snippet"
            >
              {copied ? <Check size={14} className="copied-icon" /> : <Copy size={14} />}
            </button>
          </div>
          <pre>
            <code>
              <span className="code-keyword">const</span> payment = <span className="code-keyword">await</span> paygate.payins.<span className="code-function">create</span>({`{`}
              {"\n  "}amount: <span className="code-number">24900</span>,
              {"\n  "}currency: <span className="code-string">"INR"</span>,
              {"\n  "}customer: <span className="code-string">"merchant_customer_108"</span>,
              {"\n  "}methods: [<span className="code-string">"upi"</span>, <span className="code-string">"card"</span>, <span className="code-string">"netbanking"</span>],
              {"\n  "}webhook_url: <span className="code-string">"https://merchant.app/webhooks"</span>
              {"\n"}{`});`}
              {"\n\n"}<span className="code-keyword">return</span> payment.checkout_url;
            </code>
          </pre>
        </div>

        <div className="reveal visible">
          <div className="section-heading">
            <p className="eyebrow">Built for Developers</p>
            <h2>Powerful APIs with clean integration paths.</h2>
            <p>
              REST APIs, Webhooks, SDK Support, Sandbox Environment, API Documentation, and Real-Time Updates for
              high-scale engineering teams.
            </p>
          </div>
          <a className="btn btn-primary" href="#developers">View API Documentation</a>
        </div>
      </div>
    </section>
  );
}
