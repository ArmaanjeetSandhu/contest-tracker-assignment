import React from "react";
const ErrorAlert = ({ error, onDismiss }) => {
  if (!error) return null;
  return (
    <div className="error-alert">
      <div className="error-content">
        <i className="fas fa-exclamation-circle"></i>
        <span className="error-message">
          {typeof error === "string"
            ? error
            : Array.isArray(error)
            ? error.map((err, i) => <div key={i}>{err.msg || err}</div>)
            : "An error occurred"}
        </span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="error-dismiss">
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
};
export default ErrorAlert;
