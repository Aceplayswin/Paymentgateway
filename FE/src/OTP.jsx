import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resendOtp, verifyOtp, verifyResetOtp } from "./services/auth";
import {
  clearPendingOtpSession,
  getDashboardPath,
  getPendingOtpSession,
  saveAuthSession,
  savePendingOtpSession,
} from "./utils/authStorage";
import { initMerchantOnboarding } from "./utils/onboardingStorage";
import { notifyAdminMerchantRequest } from "./utils/notificationStorage";
import { showServerErrorToast, showServerSuccessToast } from "./utils/toast";

const OTP_LENGTH = 6;

function OTP({ pendingSession: pendingSessionProp }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingSession, setPendingSession] = useState(
    pendingSessionProp || getPendingOtpSession()
  );
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  const isPasswordReset = pendingSession?.flow === "password_reset";

  useEffect(() => {
    if (!pendingSession?.otpSessionId) {
      navigate(isPasswordReset ? "/forgot-password" : "/register", { replace: true });
    }
  }, [navigate, pendingSession?.otpSessionId, isPasswordReset]);

  const email = pendingSession?.email || location.state?.email || "your email";

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) {
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    if (errorMessage) {
      setErrorMessage("");
    }

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }

    event.preventDefault();
    const nextOtp = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((digit, index) => {
      nextOtp[index] = digit;
    });
    setOtp(nextOtp);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const otpCode = otp.join("");

    if (!/^\d{6}$/.test(otpCode)) {
      setErrorMessage("Enter the 6-digit verification code.");
      return;
    }

    if (!pendingSession?.otpSessionId) {
      navigate(isPasswordReset ? "/forgot-password" : "/register", { replace: true });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (isPasswordReset) {
        await verifyResetOtp({
          otpSessionId: pendingSession.otpSessionId,
          otp: otpCode,
        });

        savePendingOtpSession({
          ...pendingSession,
          otpVerified: true,
        });

        navigate("/reset-password", { replace: true });
        return;
      }

      const response = await verifyOtp({
        otpSessionId: pendingSession.otpSessionId,
        otp: otpCode,
      });

      if (pendingSession.flow === "signup") {
        initMerchantOnboarding(response.data.user);
        const user = response.data.user;
        const merchantName =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
        notifyAdminMerchantRequest({
          merchantId: user.id,
          merchantName,
          email: user.email,
        });
        clearPendingOtpSession();

        navigate("/login", {
          replace: true,
          state: {
            message: "Registration successful. Sign in once your account is approved.",
          },
        });
        return;
      }

      saveAuthSession({
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
      clearPendingOtpSession();

      navigate(getDashboardPath(response.data.user.role), { replace: true });
    } catch (error) {
      if (error.data?.message) {
        showServerErrorToast(error);
      } else {
        setErrorMessage("Unable to verify OTP. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingSession?.otpSessionId) {
      navigate(isPasswordReset ? "/forgot-password" : "/register", { replace: true });
      return;
    }

    setIsResending(true);
    setErrorMessage("");

    try {
      const response = await resendOtp({
        otpSessionId: pendingSession.otpSessionId,
      });
      showServerSuccessToast(response.message);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (error) {
      if (error.data?.message) {
        showServerErrorToast(error);
      } else {
        setErrorMessage("Unable to resend OTP. Please sign up again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  if (!pendingSession?.otpSessionId) {
    return null;
  }

  const isComplete = otp.every((digit) => digit !== "");

  return (
    <main className="auth-page">
      <div className="bg-shape shape-1" />
      <div className="bg-shape shape-2" />
      <div className="bg-shape shape-3" />

      <section className="auth-card otp-card" aria-label="OTP verification">
        <h1>{isPasswordReset ? "Verify your email" : "Verify your account"}</h1>
        <p className="auth-subtitle">
          {isPasswordReset ? (
            <>
              Enter the 6-digit code we sent to <strong>{email}</strong> to reset your password.
            </>
          ) : (
            <>
              Enter the 6-digit code we sent to <strong>{email}</strong> to complete signup.
            </>
          )}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="otp-row" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className="otp-input"
                value={digit}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                aria-label={`OTP digit ${index + 1}`}
                disabled={isSubmitting}
                required
              />
            ))}
          </div>

          <button type="submit" className="primary-btn" disabled={isSubmitting || !isComplete}>
            {isSubmitting ? "Verifying..." : "Verify"}
          </button>

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <button
            type="button"
            className="text-link resend-link"
            onClick={handleResend}
            disabled={isSubmitting || isResending}
          >
            {isResending ? "Sending..." : "Resend OTP"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default OTP;
