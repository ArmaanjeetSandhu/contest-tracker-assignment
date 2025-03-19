import React from "react";

function ViewToggle({ currentView, onViewChange }) {
  const toggleView = () => {
    const newView = currentView === "card" ? "table" : "card";
    onViewChange(newView);
  };

  return (
    <div className="view-toggle-single">
      <button
        className="view-toggle-btn"
        onClick={toggleView}
        title={currentView === "card" ? "Switch to Table View" : "Switch to Card View"}
      >
        <i className={`fas ${currentView === "card" ? "fa-table" : "fa-th-large"}`}></i>
      </button>
    </div>
  );
}

export default ViewToggle;