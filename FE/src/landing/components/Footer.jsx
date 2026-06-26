import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="layout footer-grid">
        <div className="footer-brand-column">
          <a className="brand" href="#home">
            <span className="brand-mark">P</span>
            <span>Paygate</span>
          </a>
          <p className="footer-desc">Premium payment gateway infrastructure for India and global markets.</p>
        </div>
        <div>
          <h3>Company</h3>
          <a href="#about">About</a>
          <a href="#careers">Careers</a>
          <a href="#contact">Contact</a>
        </div>
        <div>
          <h3>Product</h3>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#documentation">Documentation</a>
        </div>
        <div>
          <h3>Resources</h3>
          <a href="#blog">Blog</a>
          <a href="#help">Help Center</a>
          <a href="#docs">API Docs</a>
        </div>
        <div>
          <h3>Legal</h3>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms &amp; Conditions</Link>
          <a href="#compliance">Compliance</a>
        </div>
        <div>
          <h3>Support</h3>
          <a href="mailto:support@paygate.com">Email</a>
          <a href="tel:+1234567890">Phone</a>
          <a href="#chat">Live Chat</a>
          <a href="#linkedin">LinkedIn</a>
        </div>
      </div>
      <div className="layout footer-bottom">
        <p>&copy; {new Date().getFullYear()} Paygate. All rights reserved.</p>
      </div>
    </footer>
  );
}
