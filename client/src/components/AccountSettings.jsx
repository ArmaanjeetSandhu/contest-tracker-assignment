import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteAccount } from "../redux/authSlice";
import "../styles/AccountSettings.css";
const AccountSettings = () => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };
  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDeleteConfirmText("");
    setError(null);
  };
  const handleConfirmDelete = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete my account") {
      setError('Please type "delete my account" to confirm');
      return;
    }
    try {
      await dispatch(deleteAccount()).unwrap();
      navigate("/");
    } catch (err) {
      setError(err || "Failed to delete account. Please try again.");
    }
  };
  if (!user) {
    return (
      <div className="account-settings-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading account information...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="account-settings-container">
      <div className="account-settings-card">
        <div className="account-header">
          <h2>Account Settings</h2>
          <p>Manage your account preferences and settings</p>
        </div>
        <div className="account-info-section">
          <h3>Account Information</h3>
          <div className="account-info-grid">
            <div className="info-item">
              <span className="info-label">Name</span>
              <span className="info-value">{user.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Type</span>
              <span className="info-value">
                <span className={`role-badge ${user.role}`}>
                  {user.role === "admin" ? (
                    <>
                      <i className="fas fa-user-shield"></i> Admin
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user"></i> User
                    </>
                  )}
                </span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Member Since</span>
              <span className="info-value">
                {new Date(user.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="danger-zone-section">
          <h3>Danger Zone</h3>
          <p className="danger-description">
            Be careful with these actions, they cannot be undone.
          </p>
          {!showDeleteConfirmation ? (
            <button className="delete-account-btn" onClick={handleDeleteClick}>
              <i className="fas fa-user-slash"></i> Delete Account
            </button>
          ) : (
            <div className="delete-confirmation">
              <p className="delete-warning">
                <i className="fas fa-exclamation-triangle"></i>
                This action is permanent and cannot be undone. All your data
                will be permanently removed.
              </p>
              <div className="confirm-input-group">
                <label htmlFor="delete-confirm">
                  Type <strong>"delete my account"</strong> to confirm:
                </label>
                <input
                  id="delete-confirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="delete my account"
                  className={error ? "error" : ""}
                />
                {error && <p className="confirm-error">{error}</p>}
              </div>
              <div className="confirm-buttons">
                <button
                  className="cancel-delete-btn"
                  onClick={handleCancelDelete}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="confirm-delete-btn"
                  onClick={handleConfirmDelete}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AccountSettings;
