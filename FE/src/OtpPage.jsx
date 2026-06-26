import { Navigate, useLocation } from "react-router-dom";
import OTP from "./OTP";
import {
  getDashboardPath,
  getPendingOtpSession,
  isAuthenticated,
  savePendingOtpSession,
} from "./utils/authStorage";

function resolvePendingOtp(locationState) {
  const stored = getPendingOtpSession();
  if (stored?.otpSessionId) {
    return stored;
  }

  if (locationState?.otpSessionId) {
    const pending = {
      otpSessionId: locationState.otpSessionId,
      email: locationState.email,
      flow: locationState.flow || "signup",
    };
    savePendingOtpSession(pending);
    return pending;
  }

  return null;
}

export default function OtpPage() {
  const location = useLocation();
  const pendingSession = resolvePendingOtp(location.state);

  if (isAuthenticated() && !pendingSession?.otpSessionId) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  if (!pendingSession?.otpSessionId) {
    const fallback =
      location.state?.flow === "password_reset" || pendingSession?.flow === "password_reset"
        ? "/forgot-password"
        : "/register";
    return <Navigate to={fallback} replace />;
  }

  return <OTP pendingSession={pendingSession} />;
}
