import { useEffect, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "./services/auth";
import { clearPendingOtpSession, getPendingOtpSession } from "./utils/authStorage";
import {
  PASSWORD_ERROR,
  validatePassword,
} from "./utils/validation";
import { showServerErrorToast, showServerSuccessToast } from "./utils/toast";

function ResetPassword() {
  const navigate = useNavigate();
  const [pendingSession, setPendingSession] = useState(getPendingOtpSession());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!pendingSession?.otpSessionId || pendingSession.flow !== "password_reset") {
      navigate("/forgot-password", { replace: true });
      return;
    }

    if (!pendingSession.otpVerified) {
      navigate("/otp", { replace: true });
    }
  }, [navigate, pendingSession]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!validatePassword(password)) {
      setErrorMessage(PASSWORD_ERROR);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword({
        otpSessionId: pendingSession.otpSessionId,
        newPassword: password,
      });

      showServerSuccessToast(response.message);
      clearPendingOtpSession();

      navigate("/login", {
        replace: true,
        state: { message: "Password reset successful. Sign in with your new password." },
      });
    } catch (error) {
      if (error.data?.message) {
        showServerErrorToast(error);
      } else {
        setErrorMessage("Unable to reset password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pendingSession?.otpSessionId || !pendingSession.otpVerified) {
    return null;
  }

  return (
    <main className="auth-page">
      <div className="bg-shape shape-1" />
      <div className="bg-shape shape-2" />
      <div className="bg-shape shape-3" />

      <section className="auth-card" aria-label="Reset password form">
        <div className="auth-brand">PAYGATE</div>
        <h1>Set New Password</h1>
        <p className="auth-subtitle">
          Create a new password for <strong>{pendingSession.email}</strong>.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="new-password">
            New Password
          </label>
          <div className="password-field">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              className="field-input"
              placeholder="Enter new password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              autoComplete="new-password"
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <label className="field-label" htmlFor="confirm-password">
            Confirm Password
          </label>
          <div className="password-field">
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              className="field-input"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              autoComplete="new-password"
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((previous) => !previous)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Reset Password"}
          </button>
          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
        </form>

        <p className="auth-switch">
          <button type="button" className="text-link" onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </p>
      </section>
    </main>
  );
}

export default ResetPassword;
