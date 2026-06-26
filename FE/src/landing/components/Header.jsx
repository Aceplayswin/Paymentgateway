import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "../../context/ThemeProvider";
import { getDashboardPath, isAuthenticated } from "../../utils/authStorage";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const loggedIn = isAuthenticated();
  const dashboardPath = loggedIn ? getDashboardPath() : null;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
    document.body.classList.remove("menu-open");
  };

  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <nav className="nav-shell" aria-label="Main navigation">
        <a className="brand" href="#home" aria-label="Paygate home">
          <span className="brand-mark">P</span>
          <span>Paygate</span>
        </a>

        <button 
          className="menu-toggle" 
          type="button" 
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isOpen}
          onClick={toggleMenu}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className={`nav-menu ${isOpen ? "open" : ""}`} data-nav-menu>
          <a href="#home" onClick={handleLinkClick}>Home</a>
          <a href="#features" onClick={handleLinkClick}>Features</a>
          <a href="#solutions" onClick={handleLinkClick}>Solutions</a>
          <a href="#developers" onClick={handleLinkClick}>Developers</a>
          <a href="#security" onClick={handleLinkClick}>Security</a>
          <a href="#pricing" onClick={handleLinkClick}>Pricing</a>
          <a href="#contact" onClick={handleLinkClick}>Contact</a>
          <div className="mobile-auth">
            {loggedIn ? (
              <Link className="btn btn-primary" to={dashboardPath} onClick={handleLinkClick}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link className="btn btn-secondary" to="/login" onClick={handleLinkClick}>Login</Link>
                <Link className="btn btn-primary" to="/register" onClick={handleLinkClick}>Sign Up</Link>
              </>
            )}
          </div>
        </div>

        <div className="nav-actions">
          <button 
            className="theme-toggle" 
            type="button" 
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {loggedIn ? (
            <Link className="btn btn-primary desktop-only" to={dashboardPath}>Dashboard</Link>
          ) : (
            <>
              <Link className="btn btn-secondary desktop-only" to="/login">Login</Link>
              <Link className="btn btn-primary desktop-only" to="/register">Sign Up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
