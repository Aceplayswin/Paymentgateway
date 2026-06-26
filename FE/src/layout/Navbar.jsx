import { useEffect, useState } from "react";
import { FiMenu, FiSearch, FiX } from "react-icons/fi";
import NotificationBell from "../components/NotificationBell";
import ThemeToggle from "../components/ThemeToggle";
import ProfileMenu from "../components/ProfileMenu";
import { getUserDisplayName, getUserRole } from "../utils/authStorage";
import { PROFILE_CHANGED_EVENT } from "../utils/profileStorage";

function Navbar({ onOpenSidebar, merchantName, darkMode, onToggleTheme, onLogout }) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [userName, setUserName] = useState(() => getUserDisplayName() || merchantName);
  const userRole = getUserRole();

  useEffect(() => {
    const refreshName = () => {
      setUserName(getUserDisplayName() || merchantName);
    };

    window.addEventListener(PROFILE_CHANGED_EVENT, refreshName);
    return () => window.removeEventListener(PROFILE_CHANGED_EVENT, refreshName);
  }, [merchantName]);

  return (
    <header className={`top-navbar ${isSearchExpanded ? "search-expanded" : ""}`}>
      {isSearchExpanded ? (
        <div className="nav-search-full">
          <FiSearch />
          <form autoComplete="off" onSubmit={(event) => event.preventDefault()} role="search">
            <input
              type="search"
              name="dashboard-search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
              placeholder="Search transactions, reports, merchants"
              className="search-input-full"
            />
          </form>
          <button
            type="button"
            className="icon-action close-search"
            onClick={() => setIsSearchExpanded(false)}
            aria-label="Close search"
          >
            <FiX />
          </button>
        </div>
      ) : (
        <>
          <div className="nav-left">
            <button type="button" className="icon-action mobile-only" onClick={onOpenSidebar}>
              <FiMenu />
            </button>
            <div className="nav-search desktop-search">
              <FiSearch />
              <form autoComplete="off" onSubmit={(event) => event.preventDefault()} role="search">
                <input
                  type="search"
                  name="dashboard-search"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="Search transactions, reports, merchants"
                />
              </form>
            </div>
            <button
              type="button"
              className="icon-action mobile-search-trigger"
              onClick={() => setIsSearchExpanded(true)}
              aria-label="Open search"
            >
              <FiSearch />
            </button>
          </div>

          <div className="nav-right">
            <span className={`role-badge ${userRole}`}>
              {userRole === "admin" ? "Admin" : "Merchant"}
            </span>
            <NotificationBell />
            <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} />
            <ProfileMenu merchantName={userName} onLogout={onLogout} />
          </div>
        </>
      )}
    </header>
  );
}

export default Navbar;
