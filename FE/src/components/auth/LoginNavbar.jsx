import { Moon, Sun } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeProvider";
import { getDashboardPath, isAuthenticated } from "../../utils/authStorage";

function LoginNavbar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isRegisterPage = pathname === "/register";
  const loggedIn = isAuthenticated();
  const dashboardPath = loggedIn ? getDashboardPath() : null;

  return (
    <header className="login-navbar">
      <nav className="login-navbar__inner" aria-label="Authentication navigation">
        <Link className="login-navbar__brand" to="/" aria-label="Paygate home">
          <span className="login-navbar__logo" aria-hidden="true">
            P
          </span>
          <span className="login-navbar__name">Paygate</span>
        </Link>

        <div className="login-navbar__actions">
          <button
            type="button"
            className="login-navbar__theme-toggle"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link className="login-navbar__link" to="/">
            Home
          </Link>
          {loggedIn ? (
            <Link className="login-navbar__link login-navbar__link--primary" to={dashboardPath}>
              Dashboard
            </Link>
          ) : isRegisterPage ? (
            <Link className="login-navbar__link login-navbar__link--primary" to="/login">
              Login
            </Link>
          ) : (
            <Link className="login-navbar__link login-navbar__link--primary" to="/register">
              Sign Up
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default LoginNavbar;
