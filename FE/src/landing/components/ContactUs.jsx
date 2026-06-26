import { useState } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import toast from "react-hot-toast";
import { validateEmail } from "../../utils/validation";

const INQUIRY_OPTIONS = [
  { value: "general", label: "General Inquiry" },
  { value: "sales", label: "Sales & Pricing" },
  { value: "integration", label: "API & Integration" },
  { value: "support", label: "Technical Support" },
  { value: "partnership", label: "Partnership" },
];

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  inquiry: "general",
  message: "",
};

function validateContactForm(form) {
  const name = form.name.trim();
  const email = form.email.trim().toLowerCase();
  const phone = form.phone.trim();
  const message = form.message.trim();

  if (!name || name.length < 2) {
    return "Please enter your full name.";
  }

  if (!validateEmail(email)) {
    return "Please enter a valid email address.";
  }

  if (phone && !/^\+?[\d\s-]{10,15}$/.test(phone)) {
    return "Please enter a valid phone number.";
  }

  if (!message || message.length < 10) {
    return "Message must be at least 10 characters.";
  }

  return "";
}

export default function ContactUs() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const error = validateContactForm(form);
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Thank you! Our team will contact you within 24 hours.");
      setForm(INITIAL_FORM);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section-pad contact-section" id="contact">
      <div className="layout">
        <div className="section-heading centered reveal visible">
          <p className="eyebrow">Contact Us</p>
          <h2>Let&apos;s talk about your payment needs.</h2>
          <p>
            Have questions about onboarding, pricing, or integrations? Send us a message and our
            team will get back to you shortly.
          </p>
        </div>

        <div className="contact-grid reveal visible">
          <aside className="contact-info">
            <div className="contact-info-card">
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden="true">
                  <Mail size={20} />
                </span>
                <div>
                  <h3>Email</h3>
                  <a href="mailto:support@paygate.com">support@paygate.com</a>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden="true">
                  <Phone size={20} />
                </span>
                <div>
                  <h3>Phone</h3>
                  <a href="tel:+911800000000">+91 1800-000-000</a>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden="true">
                  <MapPin size={20} />
                </span>
                <div>
                  <h3>Office</h3>
                  <p>Mumbai, Maharashtra, India</p>
                </div>
              </div>
            </div>
            <p className="contact-info-note">
              Business hours: Monday to Friday, 9:00 AM – 6:00 PM IST
            </p>
          </aside>

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-form-grid">
              <div className="contact-field">
                <label htmlFor="contact-name">
                  Full Name <span className="contact-required">*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  className="contact-input"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">
                  Email <span className="contact-required">*</span>
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  className="contact-input"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-phone">Phone Number</label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  className="contact-input"
                  placeholder="+91 XXXXXXXXXX"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-inquiry">
                  Inquiry Type <span className="contact-required">*</span>
                </label>
                <select
                  id="contact-inquiry"
                  name="inquiry"
                  className="contact-input"
                  value={form.inquiry}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                >
                  {INQUIRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="contact-field contact-field--full">
                <label htmlFor="contact-message">
                  Message <span className="contact-required">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  className="contact-input contact-textarea"
                  placeholder="Tell us how we can help you..."
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary contact-submit" disabled={isSubmitting}>
              <Send size={18} aria-hidden="true" />
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
