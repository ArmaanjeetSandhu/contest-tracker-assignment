import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
const PrivateRoute = () => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  if (loading) {
    return <div className="loading-spinner-container">Loading...</div>;
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};
export default PrivateRoute;
