import { useState } from "react";
import { FiArrowLeft, FiMail } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AuthPageShell from "./components/auth/AuthPageShell";
import { requestPasswordReset } from "./services/auth";
import "./styles/login.css";
import { EMAIL_ERROR, validateEmail } from "./utils/validation";
import { showServerErrorToast } from "./utils/toast";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submittedEmail = email.trim().toLowerCase();
  const isFormReady = validateEmail(submittedEmail);

  const handleChange = (event) => {
    setEmail(event.target.value);
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

    try {
      await requestPasswordReset({ email: submittedEmail });
      setIsSubmitted(true);
    } catch (error) {
      if (error.data?.message) {
        showServerErrorToast(error);
      } else {
        setIsSubmitted(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell variant="centered">
      <div className="login-page__layout login-page__layout--single">
        <section className="login-card login-card--forgot" aria-label="Forgot password form">
          {isSubmitted ? (
            <div className="login-forgot-success">
              <div className="login-forgot-success__icon" aria-hidden="true">
                <FiMail />
              </div>
              <h2 className="login-card__title">Check your email</h2>
              <p className="login-card__subtitle">
                If an account exists for <strong>{submittedEmail}</strong>, we sent password reset
                instructions. The link expires in 30 minutes.
              </p>
              <p className="login-forgot-success__hint">
                Didn&apos;t receive it? Check spam or try again with the correct email address.
              </p>
              <button
                type="button"
                className="login-submit-btn is-ready"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </button>
              <button
                type="button"
                className="login-text-link login-forgot-success__retry"
                onClick={() => setIsSubmitted(false)}
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="login-forgot-back"
                onClick={() => navigate("/login")}
                disabled={isSubmitting}
              >
                <FiArrowLeft aria-hidden="true" />
                Back to Login
              </button>

              <h2 className="login-card__title">Forgot your password?</h2>
              <p className="login-card__subtitle">
                Enter the email linked to your Paygate account. We&apos;ll send you a secure link to
                reset your password.
              </p>

              <form className="login-form login-form--forgot" onSubmit={handleSubmit}>
                <div>
                  <label className="login-field-label" htmlFor="forgot-email">
                    Email ID
                  </label>
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    className="login-field-input"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                  />
                  <p className="login-field-hint">
                    Use the same email you registered with on Paygate.
                  </p>
                </div>

                <button
                  type="submit"
                  className={`login-submit-btn${isFormReady ? " is-ready" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending link..." : "Send Reset Link"}
                </button>

                <div className="login-message-slot">
                  {errorMessage ? (
                    <p className="login-message login-message--error">{errorMessage}</p>
                  ) : null}
                </div>
              </form>
            </>
          )}

          <div className="login-card__footer">
            <p className="login-card__switch">
              Remember your password?{" "}
              <button
                type="button"
                className="login-text-link"
                onClick={() => navigate("/login")}
                disabled={isSubmitting}
              >
                Sign in
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

export default ForgotPassword;
