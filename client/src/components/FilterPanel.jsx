import React, { useState } from "react";
function FilterPanel({ filters, onFilterChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const platforms = ["Codeforces", "CodeChef", "Leetcode"];
  const togglePlatform = (platform) => {
    let newPlatforms;
    if (filters.platforms.includes(platform)) {
      if (filters.platforms.length === 1) {
        return;
      }
      newPlatforms = filters.platforms.filter((p) => p !== platform);
    } else {
      newPlatforms = [...filters.platforms, platform];
    }
    onFilterChange({ ...filters, platforms: newPlatforms });
  };
  const selectAllPlatforms = () => {
    onFilterChange({ ...filters, platforms: [...platforms] });
  };
  const toggleFilters = () => {
    setIsOpen(!isOpen);
  };
  return (
    <div className="filter-panel">
      <button
        className="filter-toggle"
        onClick={toggleFilters}
        aria-expanded={isOpen}
      >
        <i className="fas fa-filter"></i> Filter Contests
        <i className={`fas fa-chevron-${isOpen ? "up" : "down"}`}></i>
      </button>
      {isOpen && (
        <div className="filter-content">
          <div className="filter-section">
            <div className="filter-header">
              <h3>Platforms</h3>
              <button className="select-all" onClick={selectAllPlatforms}>
                Select All
              </button>
            </div>
            <div className="filter-options">
              {platforms.map((platform) => (
                <label key={platform} className="filter-option">
                  <input
                    type="checkbox"
                    checked={filters.platforms.includes(platform)}
                    onChange={() => togglePlatform(platform)}
                  />
                  <span className={`platform-label ${platform.toLowerCase()}`}>
                    {platform}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default FilterPanel;
