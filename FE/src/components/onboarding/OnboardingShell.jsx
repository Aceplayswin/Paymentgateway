import { Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeProvider";
import "../../styles/onboarding.css";
import "../../styles/kyc.css";

function OnboardingShell({ children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className={`onboarding-shell onboarding-shell--${theme}`}>
      <div className="bg-shape shape-1" />
      <div className="bg-shape shape-2" />
      <div className="bg-shape shape-3" />

      <header className="onboarding-navbar">
        <nav className="onboarding-navbar__inner" aria-label="Onboarding navigation">
          <Link className="onboarding-navbar__brand" to="/" aria-label="Paygate home">
            <span className="onboarding-navbar__logo" aria-hidden="true">
              P
            </span>
            <span className="onboarding-navbar__name">Paygate</span>
          </Link>

          <div className="onboarding-navbar__actions">
            <button
              type="button"
              className="onboarding-navbar__theme-toggle"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link className="onboarding-navbar__link" to="/dashboard/merchant">
              Dashboard
            </Link>
          </div>
        </nav>
      </header>

      <div className="onboarding-shell__body">{children}</div>
    </main>
  );
}

export default OnboardingShell;
