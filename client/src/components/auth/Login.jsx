import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearError, loadUser, login } from "../../redux/authSlice";
const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const { email, password } = formData;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, error, loading } = useSelector(
    (state) => state.auth
  );
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
    if (error) {
      if (Array.isArray(error)) {
        const errorObj = {};
        error.forEach((err) => {
          errorObj[err.param] = err.msg;
        });
        setFormErrors(errorObj);
      } else if (typeof error === "string") {
        setFormErrors({ general: error });
      }
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, error, navigate, dispatch]);
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: null });
    }
  };
  const validateForm = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }
    if (!password) {
      errors.password = "Password is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const onSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await dispatch(login({ email, password })).unwrap();
        dispatch(loadUser());
      } catch (err) {
        console.error("Login failed:", err);
      }
    }
  };
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Sign In</h2>
        <p>Sign in to your account</p>
        {formErrors.general && (
          <div className="auth-error">{formErrors.general}</div>
        )}
        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              className={`auth-input ${formErrors.email ? "is-invalid" : ""}`}
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
              className={`auth-input ${
                formErrors.password ? "is-invalid" : ""
              }`}
            />
            {formErrors.password && (
              <div className="invalid-feedback">{formErrors.password}</div>
            )}
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="auth-links">
          <p>
            Don't have an account? <a href="/register">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Login;
