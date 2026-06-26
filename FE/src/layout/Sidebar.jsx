import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAdminNotifications } from "../context/AdminNotificationContext";
import { getDashboardPath, getUserRole } from "../utils/authStorage";
import {
  FiActivity,
  FiBookOpen,
  FiBriefcase,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCode,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiKey,
  FiList,
  FiLogOut,
  FiRefreshCcw,
  FiShield,
  FiTerminal,
  FiUsers,
  FiWifi,
} from "react-icons/fi";

const menuConfig = [
  { label: "Dashboard", icon: FiGrid, path: "/dashboard", roles: ["admin", "merchant"] },
  {
    label: "MERCHANT",
    icon: FiUsers,
    roles: ["admin"],
    children: [
      { label: "New Request", path: "/merchant/new-request", icon: FiFileText, roles: ["admin"], badgeKey: "merchantRequests" },
      { label: "KYC Requests", path: "/merchant/kyc-requests", icon: FiShield, roles: ["admin"], badgeKey: "kycRequests" },
      { label: "All Merchant", path: "/merchant/all", icon: FiList, roles: ["admin"] },
    ],
  },
  {
    label: "PAYIN",
    icon: FiCreditCard,
    roles: ["admin", "merchant"],
    children: [
      { label: "Transactions", path: "/payin/transactions", icon: FiList, roles: ["admin", "merchant"] },
      { label: "Summary", path: "/payin/summary", icon: FiActivity, roles: ["admin", "merchant"] },
      { label: "Refund Callback", path: "/payin/refund-callback", icon: FiRefreshCcw, roles: ["admin", "merchant"] },
      { label: "Settlements", path: "/payin/settlements", icon: FiDollarSign, roles: ["admin", "merchant"] },
      { label: "Sales Report", path: "/payin/sales-report", icon: FiBookOpen, roles: ["admin", "merchant"] },
      { label: "Chargebacks & Liens", path: "/payin/chargebacks-liens", icon: FiShield, roles: ["admin", "merchant"] },
      { label: "Complaints", path: "/payin/complaints", icon: FiHelpCircle, roles: ["admin", "merchant"] },
    ],
  },
  {
    label: "PAYOUT",
    icon: FiBriefcase,
    roles: ["admin", "merchant"],
    children: [
      { label: "Transactions", path: "/payout/transactions", icon: FiList, roles: ["admin", "merchant"] },
      { label: "IP Whitelist", path: "/payout/ip-whitelist", icon: FiWifi, roles: ["admin", "merchant"] },
      { label: "Ledger", path: "/payout/ledger", icon: FiBookOpen, roles: ["admin", "merchant"] },
      { label: "Balance", path: "/payout/balance", icon: FiDollarSign, roles: ["admin", "merchant"] },
    ],
  },
  { label: "GATEWAY", icon: FiKey, path: "/admin/gateway", roles: ["admin"] },
  {
    label: "API & DOCS",
    icon: FiTerminal,
    roles: ["merchant"],
    children: [
      { label: "API Keys", path: "/developers/api-keys", icon: FiKey, roles: ["merchant"] },
      { label: "API Documentation", path: "/developers/docs", icon: FiCode, roles: ["merchant"] },
    ],
  },
  { label: "REPORTS", icon: FiFileText, path: "/payin/reports", roles: ["admin", "merchant"] },
];

function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile, onLogout }) {
  const [openSections, setOpenSections] = useState({
    MERCHANT: true,
    PAYIN: false,
    PAYOUT: false,
    "API & DOCS": false,
  });

  const userRole = getUserRole();
  const dashboardPath = getDashboardPath(userRole);
  const { counts } = useAdminNotifications();

  const filteredMenuConfig = useMemo(() => {
    return menuConfig
      .filter((menu) => !menu.roles || menu.roles.includes(userRole))
      .map((menu) => {
        if (menu.children) {
          const children = menu.children.filter((child) => !child.roles || child.roles.includes(userRole));
          return { ...menu, children };
        }
        if (menu.path === "/dashboard") {
          return { ...menu, path: dashboardPath };
        }
        return menu;
      })
      .filter((menu) => !menu.children || menu.children.length > 0);
  }, [userRole, dashboardPath]);

  const classes = useMemo(() => {
    let value = "sidebar-shell";
    if (collapsed) value += " collapsed";
    if (mobileOpen) value += " mobile-open";
    return value;
  }, [collapsed, mobileOpen]);

  const toggleSection = (label) => {
    if (collapsed) {
      onToggleCollapse();
      setOpenSections((prev) => ({ ...prev, [label]: true }));
      return;
    }
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const getNavClass = ({ isActive }) => (isActive ? "menu-link active" : "menu-link");
  const getSubNavClass = ({ isActive }) => (isActive ? "submenu-item active" : "submenu-item");

  return (
    <>
      {mobileOpen ? <div className="sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" /> : null}
      <aside className={classes}>
        <button
          type="button"
          className="sidebar-edge-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>

        <div className="sidebar-top">
          <div className="logo-wrap">
            <span>PG</span>
            <strong className="sidebar-label">PayGate Pro</strong>
          </div>
        </div>

        <nav className="side-nav">
          {filteredMenuConfig.map((menu) => {
            if (menu.children) {
              const isOpen = openSections[menu.label];
              const MenuIcon = menu.icon;
              return (
                <div key={menu.label} className="menu-group">
                  <button type="button" className="menu-parent" onClick={() => toggleSection(menu.label)}>
                    <span>
                      <MenuIcon />
                      <span className="sidebar-label">{menu.label}</span>
                    </span>
                    <FiChevronDown className={`sidebar-chevron ${isOpen ? "rotated" : ""}`} />
                  </button>
                  {isOpen || collapsed ? (
                    <div className="submenu">
                      {menu.children.map((child) => {
                        const ChildIcon = child.icon;
                        const badgeCount = child.badgeKey ? counts[child.badgeKey] || 0 : 0;
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            end
                            className={getSubNavClass}
                            onClick={onCloseMobile}
                          >
                            <ChildIcon />
                            <span className="sidebar-label">{child.label}</span>
                            {badgeCount > 0 ? (
                              <span className="sidebar-notification-badge">{badgeCount > 99 ? "99+" : badgeCount}</span>
                            ) : null}
                          </NavLink>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }

            const Icon = menu.icon;
            return (
              <NavLink key={menu.path} to={menu.path} end className={getNavClass} onClick={onCloseMobile}>
                <Icon />
                <span className="sidebar-label">{menu.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="logout-link" onClick={onLogout}>
            <FiLogOut />
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
