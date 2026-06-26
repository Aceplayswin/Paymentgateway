import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { applyTheme, getStoredTheme, setStoredTheme, THEME_STORAGE_KEY } from "../utils/theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    setStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === THEME_STORAGE_KEY && (event.newValue === "dark" || event.newValue === "light")) {
        setTheme(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === "dark",
      isLight: theme === "light",
    }),
    [theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
