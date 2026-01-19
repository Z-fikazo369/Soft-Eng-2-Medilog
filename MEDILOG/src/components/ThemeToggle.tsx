import React from "react";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      title="Toggle Dark Mode"
    >
      {theme === "light" ? (
        <i className="bi bi-moon-stars-fill"></i> // Moon Icon for Light Mode
      ) : (
        <i className="bi bi-sun-fill text-warning"></i> // Sun Icon for Dark Mode
      )}
    </button>
  );
};

export default ThemeToggle;
