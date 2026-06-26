export const THEME_STORAGE_KEY = "paygate_theme";

const LEGACY_THEME_KEYS = [
  "paygate_auth_theme",
  "paygate_landing_theme",
  "paygate_dashboard_theme",
];

export function getStoredTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  for (const legacyKey of LEGACY_THEME_KEYS) {
    const legacyTheme = localStorage.getItem(legacyKey);
    if (legacyTheme === "dark" || legacyTheme === "light") {
      setStoredTheme(legacyTheme);
      return legacyTheme;
    }
  }

  return "light";
}

export function setStoredTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  LEGACY_THEME_KEYS.forEach((legacyKey) => localStorage.removeItem(legacyKey));
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
