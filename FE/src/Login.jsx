import { useEffect, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthPageShell from "./components/auth/AuthPageShell";
import LoginPromoPanel from "./components/auth/LoginPromoPanel";
import { login as loginRequest } from "./services/auth";
import "./styles/login.css";
import { saveAuthSession } from "./utils/authStorage";
import {
  getPostLoginPath,
  syncMerchantOnboardingFromKycApi,
} from "./utils/onboardingStorage";
import { showServerErrorToast } from "./utils/toast";
import {
  EMAIL_ERROR,
  PASSWORD_ERROR,
  validateEmail,
  validatePassword,
} from "./utils/validation";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormReady =
    validateEmail(formData.email.trim().toLowerCase()) &&
    validatePassword(formData.password);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("paygate_saved_email");
    const savedRemember = localStorage.getItem("paygate_remember") === "true";
    if (savedRemember && savedEmail) {
      setRememberMe(true);
      setFormData((previous) => ({ ...previous, email: savedEmail }));
    }
  }, []);

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

    const submittedEmail = formData.email.trim().toLowerCase();
    const submittedPassword = formData.password;

    if (!validateEmail(submittedEmail)) {
      setErrorMessage(EMAIL_ERROR);
      setIsSubmitting(false);
      return;
    }

    if (!validatePassword(submittedPassword)) {
      setErrorMessage(PASSWORD_ERROR);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await loginRequest({
        email: submittedEmail,
        password: submittedPassword,
      });

      const user = response.data.user;

      saveAuthSession({
        user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });

      if (user.role !== "admin") {
        await syncMerchantOnboardingFromKycApi();
      }

      if (rememberMe) {
        localStorage.setItem("paygate_remember", "true");
        localStorage.setItem("paygate_saved_email", submittedEmail);
      } else {
        localStorage.removeItem("paygate_remember");
        localStorage.removeItem("paygate_saved_email");
      }

      navigate(getPostLoginPath(user), { replace: true });
    } catch (error) {
      if (error.data?.message || error.isNetworkError) {
        showServerErrorToast(error);
        if (error.isNetworkError) {
          setErrorMessage(
            "Unable to reach the server. Make sure the API is running and try again."
          );
        }
      } else {
        setErrorMessage("Unable to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell>
      <div className="login-page__layout">
        <LoginPromoPanel />

        <section className="login-card login-card--login" aria-label="Login form">
          <h2 className="login-card__title">Sign in to your Business now</h2>

          <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
            <div>
              <label className="login-field-label" htmlFor="login-email">
                Email ID
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                className="login-field-input"
                placeholder="Enter Email ID"
                value={formData.email}
                onChange={handleChange}
                autoComplete="username"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="login-field-label" htmlFor="login-password">
                Password
              </label>
              <div className="login-password-wrap">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="login-field-input"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
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

            <div className="login-form-row">
              <label className="login-remember" htmlFor="remember-me">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={isSubmitting}
                />
                Remember me
              </label>

              <button
                type="button"
                className="login-text-link"
                onClick={() => navigate("/forgot-password")}
                disabled={isSubmitting}
              >
                Forgot Password?
              </button>
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
              {isSubmitting ? "Signing in..." : "Login"}
            </button>

            <div className="login-message-slot">
              {successMessage ? (
                <p className="login-message login-message--success">{successMessage}</p>
              ) : null}
              {errorMessage ? (
                <p className="login-message login-message--error">{errorMessage}</p>
              ) : null}
            </div>
          </form>

          <div className="login-card__footer">
            <p className="login-card__switch">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="login-text-link"
                onClick={() => navigate("/register")}
              >
                Sign up
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

export default Login;
