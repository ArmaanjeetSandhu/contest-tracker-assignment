import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import "../../styles/UserManagement.css";
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const { user: currentUser, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (currentUser && currentUser.role !== "admin") {
      navigate("/");
      return;
    }
    fetchUsers();
  }, [isAuthenticated, currentUser, navigate]);
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/users");
      setUsers(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteUser = async (userId, userName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user ${userName}? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      setUsers(users.filter((user) => user._id !== userId));
      setSuccessMessage(`User ${userName} deleted successfully`);
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  if (loading) {
    return (
      <div className="user-management-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h2>User Management</h2>
        <p>View and manage all users and administrators</p>
      </div>
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
          <button onClick={fetchUsers} className="retry-button">
            <i className="fas fa-sync-alt"></i> Retry
          </button>
        </div>
      )}
      {successMessage && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i> {successMessage}
        </div>
      )}
      <div className="user-stats">
        <div className="stat-box">
          <h3>Total Users</h3>
          <p>{users.length}</p>
        </div>
        <div className="stat-box">
          <h3>Admins</h3>
          <p>{users.filter((user) => user.role === "admin").length}</p>
        </div>
        <div className="stat-box">
          <h3>Regular Users</h3>
          <p>{users.filter((user) => user.role === "user").length}</p>
        </div>
      </div>
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user._id}
                className={user.role === "admin" ? "admin-row" : ""}
              >
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
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
                </td>
                <td>{formatDate(user.date)}</td>
                <td>
                  {user._id !== currentUser._id ? (
                    <button
                      onClick={() => handleDeleteUser(user._id, user.name)}
                      className="delete-user-btn"
                      title="Delete user"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  ) : (
                    <span
                      className="current-user-badge"
                      title="This is your account"
                    >
                      <i className="fas fa-user-circle"></i> You
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default UserManagement;
