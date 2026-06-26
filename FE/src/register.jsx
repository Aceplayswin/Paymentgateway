import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import AuthPageShell from "./components/auth/AuthPageShell";
import LoginPromoPanel from "./components/auth/LoginPromoPanel";
import { register as registerRequest } from "./services/auth";
import "./styles/login.css";
import { savePendingOtpSession } from "./utils/authStorage";
import {
  EMAIL_ERROR,
  PASSWORD_ERROR,
  validateEmail,
  validatePassword,
} from "./utils/validation";
import { showServerErrorToast, showServerSuccessToast } from "./utils/toast";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submittedEmail = formData.email.trim().toLowerCase();
  const isFormReady =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    validateEmail(submittedEmail) &&
    formData.mobile.trim() &&
    validatePassword(formData.password);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    if (!validateEmail(submittedEmail)) {
      setErrorMessage(EMAIL_ERROR);
      setIsSubmitting(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setErrorMessage(PASSWORD_ERROR);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await registerRequest({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: submittedEmail,
        phoneNumber: formData.mobile.trim(),
        password: formData.password,
      });

      if (!response.data?.requiresOtp || !response.data?.otpSessionId) {
        setErrorMessage("Unable to start verification. Please try again.");
        return;
      }

      showServerSuccessToast(response.message);

      savePendingOtpSession({
        otpSessionId: response.data.otpSessionId,
        email: response.data.email || submittedEmail,
        flow: "signup",
      });

      navigate("/otp", {
        state: {
          otpSessionId: response.data.otpSessionId,
          email: response.data.email || submittedEmail,
          flow: "signup",
        },
      });
    } catch (error) {
      if (error.data?.message) {
        showServerErrorToast(error);
      } else {
        setErrorMessage("Unable to create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell>
      <div className="login-page__layout">
        <LoginPromoPanel />

        <section className="login-card login-card--register" aria-label="Signup form">
          <h2 className="login-card__title">Register your Business now</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field-grid">
              <div>
                <label className="login-field-label" htmlFor="first-name">
                  First Name
                </label>
                <input
                  id="first-name"
                  name="firstName"
                  type="text"
                  className="login-field-input"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="login-field-label" htmlFor="last-name">
                  Last Name
                </label>
                <input
                  id="last-name"
                  name="lastName"
                  type="text"
                  className="login-field-input"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="login-field-grid">
              <div>
                <label className="login-field-label" htmlFor="register-email">
                  Email ID
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  className="login-field-input"
                  placeholder="Enter Email ID"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="login-field-label" htmlFor="register-mobile">
                  Phone Number
                </label>
                <input
                  id="register-mobile"
                  name="mobile"
                  type="tel"
                  className="login-field-input"
                  placeholder="+91 XXXXXXXXXX"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="login-field-label" htmlFor="register-password">
                Password
              </label>
              <div className="login-password-wrap">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="login-field-input"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="login-icon-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((previous) => !previous)}
                  disabled={isSubmitting}
                >
                  {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                </button>
              </div>
              <p className="login-field-hint">Minimum 8 characters with letters and numbers.</p>
            </div>

            <div className="login-form-row login-form-row--placeholder" aria-hidden="true">
              <span>Placeholder</span>
            </div>

            <p className="login-terms">
              By continuing, you allow us to contact and assist in availing Payment services.{" "}
              <Link className="login-text-link" to="/terms">
                T&amp;C
              </Link>{" "}
              and{" "}
              <Link className="login-text-link" to="/privacy">
                Privacy Policy
              </Link>{" "}
              apply.
            </p>

            <button
              type="submit"
              className={`login-submit-btn${isFormReady ? " is-ready" : ""}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </button>

            <div className="login-message-slot">
              {errorMessage ? (
                <p className="login-message login-message--error">{errorMessage}</p>
              ) : null}
            </div>
          </form>

          <div className="login-card__footer">
            <p className="login-card__switch">
              Already have an account?{" "}
              <button
                type="button"
                className="login-text-link"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            </p>
            <p className="login-card__disclaimer">
              Paygate Limited is a RBI authorised Payment Aggregator.
            </p>
          </div>
        </section>
      </div>
    </AuthPageShell>
  );
}

export default Register;
