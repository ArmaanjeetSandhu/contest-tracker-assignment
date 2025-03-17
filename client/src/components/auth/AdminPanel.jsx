import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createAdmin, clearError } from "../../redux/authSlice";
const AdminPanel = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const { name, email, password, password2 } = formData;
  const dispatch = useDispatch();
  const { user, error, loading } = useSelector((state) => state.auth);
  const isAdmin = user && user.role === "admin";
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: null });
    }
  };
  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Name is required";
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (password !== password2) {
      errors.password2 = "Passwords do not match";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const onSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setSuccessMessage("");
      try {
        const resultAction = await dispatch(
          createAdmin({ name, email, password })
        );
        if (!resultAction.error) {
          setSuccessMessage("Admin user created successfully!");
          setFormData({
            name: "",
            email: "",
            password: "",
            password2: "",
          });
        }
      } catch (err) {
        console.error("Failed to create admin user", err);
      }
    }
  };
  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-error-message">
          <h2>Access Denied</h2>
          <p>You must be an admin to access this page.</p>
          <a href="/" className="admin-link">
            Return to Home
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        <p>Create new admin users</p>
      </div>
      {successMessage && (
        <div className="admin-success-message">{successMessage}</div>
      )}
      {error && (
        <div className="admin-error-message">
          {Array.isArray(error)
            ? error.map((err, index) => <p key={index}>{err.msg}</p>)
            : error}
          <button
            onClick={() => dispatch(clearError())}
            className="admin-clear-error"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="admin-form-container">
        <form onSubmit={onSubmit} className="admin-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              className={`admin-input ${formErrors.name ? "is-invalid" : ""}`}
            />
            {formErrors.name && (
              <div className="invalid-feedback">{formErrors.name}</div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              className={`admin-input ${formErrors.email ? "is-invalid" : ""}`}
            />
            {formErrors.email && (
              <div className="invalid-feedback">{formErrors.email}</div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              className={`admin-input ${
                formErrors.password ? "is-invalid" : ""
              }`}
            />
            {formErrors.password && (
              <div className="invalid-feedback">{formErrors.password}</div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="password2">Confirm Password</label>
            <input
              type="password"
              id="password2"
              name="password2"
              value={password2}
              onChange={onChange}
              className={`admin-input ${
                formErrors.password2 ? "is-invalid" : ""
              }`}
            />
            {formErrors.password2 && (
              <div className="invalid-feedback">{formErrors.password2}</div>
            )}
          </div>
          <button type="submit" className="admin-button" disabled={loading}>
            {loading ? "Creating..." : "Create Admin User"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default AdminPanel;
