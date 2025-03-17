import React, { useContext } from "react";
import ThemeContext from "../context/ThemeContext";
function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <>
          <i className="fas fa-moon"></i>
          <span>Dark Mode</span>
        </>
      ) : (
        <>
          <i className="fas fa-sun"></i>
          <span>Light Mode</span>
        </>
      )}
    </button>
  );
}
export default ThemeToggle;
