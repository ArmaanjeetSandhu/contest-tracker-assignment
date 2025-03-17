import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
const AdminRoute = () => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const isAdmin = user && user.role === "admin";
  if (loading) {
    return <div className="loading-spinner-container">Loading...</div>;
  }
  return isAuthenticated && isAdmin ? <Outlet /> : <Navigate to="/login" />;
};
export default AdminRoute;
