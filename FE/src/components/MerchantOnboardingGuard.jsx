import { Navigate } from "react-router-dom";
import { getUserRole } from "../utils/authStorage";
import {
  getOnboardingRedirectPath,
  syncMerchantOnboardingFromStoredAuth,
} from "../utils/onboardingStorage";

function MerchantOnboardingGuard({ children }) {
  if (getUserRole() === "admin") {
    return children;
  }

  syncMerchantOnboardingFromStoredAuth();

  const redirectPath = getOnboardingRedirectPath();

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export default MerchantOnboardingGuard;
