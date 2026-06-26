import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AdminNotificationProvider } from "../context/AdminNotificationContext";
import { useTheme } from "../context/ThemeProvider";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import KycOverlay from "../components/KycOverlay";
import MerchantOnboardingGuard from "../components/MerchantOnboardingGuard";
import { merchantInfo } from "../data/dashboardData";
import { clearAuthSession, getUserDisplayName, getUserRole } from "../utils/authStorage";
import {
  ONBOARDING_CHANGED_EVENT,
  resolveKycOverlayVisibility,
  shouldShowKycOverlay,
  syncMerchantOnboardingFromStoredAuth,
} from "../utils/onboardingStorage";
import { closeSweetAlert } from "../utils/sweetAlert";

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = getUserDisplayName() || merchantInfo.name;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const { theme, toggleTheme, isDark } = useTheme();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    closeSweetAlert();
  }, [location.pathname]);

  // Lock body scroll on mobile when sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/");
  };

  const shellClasses = [
    "dashboard-shell",
    theme,
    collapsed && !isMobile ? "collapsed" : ""
  ].filter(Boolean).join(" ");

  const userRole = getUserRole();
  const [showKycOverlay, setShowKycOverlay] = useState(false);

  useEffect(() => {
    if (userRole !== "merchant") {
      setShowKycOverlay(false);
      return undefined;
    }

    let cancelled = false;

    const refreshOverlayFromApi = async () => {
      const shouldShow = await resolveKycOverlayVisibility();
      if (!cancelled) {
        setShowKycOverlay(shouldShow);
      }
    };

    const refreshOverlayFromStorage = () => {
      setShowKycOverlay(shouldShowKycOverlay());
    };

    const refreshOverlayFromAuthStorage = () => {
      syncMerchantOnboardingFromStoredAuth();
      setShowKycOverlay(shouldShowKycOverlay());
    };

    refreshOverlayFromApi();
    window.addEventListener(ONBOARDING_CHANGED_EVENT, refreshOverlayFromStorage);
    window.addEventListener("storage", refreshOverlayFromAuthStorage);

    return () => {
      cancelled = true;
      window.removeEventListener(ONBOARDING_CHANGED_EVENT, refreshOverlayFromStorage);
      window.removeEventListener("storage", refreshOverlayFromAuthStorage);
    };
  }, [userRole]);

  return (
    <AdminNotificationProvider>
      <div className={shellClasses}>
        <Sidebar
          collapsed={isMobile ? false : collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={() => {
            if (isMobile) {
              setMobileOpen(false);
            } else {
              setCollapsed((prev) => !prev);
            }
          }}
          onCloseMobile={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
        <div className="main-panel">
          <Navbar
            onOpenSidebar={() => setMobileOpen(true)}
            merchantName={displayName}
            darkMode={isDark}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
          />
          <main className="dashboard-content">
            <MerchantOnboardingGuard>
              <Outlet key={location.pathname} />
            </MerchantOnboardingGuard>
          </main>
        </div>
        {showKycOverlay ? <KycOverlay /> : null}
      </div>
    </AdminNotificationProvider>
  );
}

export default DashboardLayout;
