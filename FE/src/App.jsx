import { Navigate, Route, Routes } from "react-router-dom";
import AppToaster from "./components/AppToaster";
import LandingPage from "./landing/LandingPage";
import Login from "./Login";
import Register from "./register";
import OtpPage from "./OtpPage";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import DashboardLayout from "./layout/DashboardLayout";
import {
  isAuthenticated as checkAuthSession,
  getDashboardPath,
  getUserRole,
} from "./utils/authStorage";
import DashboardHome from "./pages/Dashboard/Home";
import PayinTransactions from "./pages/Payin/Transactions";
import PayinSummary from "./pages/Payin/Summary";
import NewRequest from "./pages/Merchant/NewRequest";
import KycRequests from "./pages/Merchant/KycRequests";
import AdminKycDetailPage from "./pages/Merchant/AdminKycDetailPage";
import AllMerchants from "./pages/Merchant/AllMerchants";
import RefundCallback from "./pages/Payin/RefundCallback";
import Settlements from "./pages/Payin/Settlements";
import SalesReport from "./pages/Payin/SalesReport";
import Reports from "./pages/Payin/Reports";
import ChargebacksLiens from "./pages/Payin/ChargebacksLiens";
import Complaints from "./pages/Payin/Complaints";
import PayoutTransactions from "./pages/Payout/Transactions";
import IPWhitelist from "./pages/Payout/IPWhitelist";
import Ledger from "./pages/Payout/Ledger";
import Balance from "./pages/Payout/Balance";
import HostedPaymentPage from "./pages/Gateway/HostedPaymentPage";
import AdminGatewayPage from "./pages/Gateway/AdminGatewayPage";
import ApiKeysPage from "./pages/Developer/ApiKeysPage";
import ApiDocsPage from "./pages/Developer/ApiDocsPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import SettingsPage from "./pages/Settings/SettingsPage";
import SecuritySettingsPage from "./pages/Settings/SecuritySettingsPage";
import ApplicationUnderReview from "./pages/onboarding/ApplicationUnderReview";
import KycUnderReview from "./pages/onboarding/KycUnderReview";
import KycVerificationPage from "./pages/onboarding/KycVerificationPage";
import TermsAndConditions from "./pages/legal/TermsAndConditions";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";

function RoleProtectedRoute({ children, allowedRoles }) {
  const isAuthenticated = localStorage.getItem("paygate_auth") === "true";
  const userRole = getUserRole();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }

  return children;
}

function ProtectedDashboardRoute() {
  if (!checkAuthSession()) {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout />;
}

function LandingRoute() {
  if (checkAuthSession()) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  return <LandingPage />;
}

function LoginRoute() {
  if (checkAuthSession()) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  return <Login />;
}

function RegisterRoute() {
  if (checkAuthSession()) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  return <Register />;
}

function App() {
  return (
    <>
    <AppToaster />
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<RegisterRoute />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<TermsAndConditions />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/pay/:linkToken" element={<HostedPaymentPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/application-under-review" element={<ApplicationUnderReview />} />
      <Route path="/kyc-under-review" element={<KycUnderReview />} />
      <Route path="/onboarding/kyc" element={<KycVerificationPage />} />
      <Route element={<ProtectedDashboardRoute />}>
        <Route path="/dashboard" element={<Navigate to={getDashboardPath()} replace />} />
        <Route
          path="/dashboard/admin"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <DashboardHome />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/dashboard/merchant"
          element={
            <RoleProtectedRoute allowedRoles={["merchant"]}>
              <DashboardHome />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/merchant/new-request"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <NewRequest />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/merchant/kyc-requests"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <KycRequests />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/merchant/kyc-review/:email"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminKycDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/merchant/all"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AllMerchants />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/gateway"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminGatewayPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="/payin/transactions" element={<PayinTransactions />} />
        <Route path="/payin/summary" element={<PayinSummary />} />
        <Route path="/payin/refund-callback" element={<RefundCallback />} />
        <Route path="/payin/settlements" element={<Settlements />} />
        <Route path="/payin/sales-report" element={<SalesReport />} />
        <Route path="/payin/reports" element={<Reports />} />
        <Route path="/payin/chargebacks-liens" element={<ChargebacksLiens />} />
        <Route path="/payin/complaints" element={<Complaints />} />
        <Route path="/payout/transactions" element={<PayoutTransactions />} />
        <Route path="/payout/ip-whitelist" element={<IPWhitelist />} />
        <Route path="/payout/ledger" element={<Ledger />} />
        <Route path="/payout/balance" element={<Balance />} />
        <Route
          path="/developers/api-keys"
          element={
            <RoleProtectedRoute allowedRoles={["merchant"]}>
              <ApiKeysPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/developers/docs"
          element={
            <RoleProtectedRoute allowedRoles={["merchant"]}>
              <ApiDocsPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="/security-center" element={<Navigate to="/settings/security" replace />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/security" element={<SecuritySettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
