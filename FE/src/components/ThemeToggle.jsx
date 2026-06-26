import { FiMoon, FiSun } from "react-icons/fi";

function ThemeToggle({ darkMode, onToggle }) {
  return (
    <button type="button" className="icon-action" onClick={onToggle} aria-label="Toggle theme">
      {darkMode ? <FiSun /> : <FiMoon />}
    </button>
  );
}

export default ThemeToggle;
