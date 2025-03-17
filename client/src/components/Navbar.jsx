import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/authSlice";
import ThemeContext from "../context/ThemeContext";
const Navbar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const isAdmin = user && user.role === "admin";
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(event.target)
      ) {
        setAdminMenuOpen(false);
      }
    }
    if (adminMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [adminMenuOpen]);
  const handleLogout = () => {
    dispatch(logout());
  };
  const toggleAdminMenu = (e) => {
    e.preventDefault();
    setAdminMenuOpen(!adminMenuOpen);
  };
  const AdminDropdown = () => (
    <div className="admin-dropdown" ref={adminMenuRef}>
      <a
        href="#!"
        className={`nav-link ${
          location.pathname.startsWith("/admin") ? "active" : ""
        }`}
        onClick={toggleAdminMenu}
      >
        <i className="fas fa-user-shield" style={{ marginRight: "6px" }}></i>{" "}
        Admin{" "}
        <i
          className={`fas fa-chevron-${adminMenuOpen ? "up" : "down"}`}
          style={{ marginLeft: "6px", fontSize: "0.7rem" }}
        ></i>
      </a>
      {adminMenuOpen && (
        <div className="admin-dropdown-menu">
          <Link
            to="/admin/panel"
            className={`admin-dropdown-item ${
              location.pathname === "/admin/panel" ? "active" : ""
            }`}
            onClick={() => setAdminMenuOpen(false)}
          >
            <i className="fas fa-cog" style={{ marginRight: "6px" }}></i> Admin
            Panel
          </Link>
          <Link
            to="/admin/solutions"
            className={`admin-dropdown-item ${
              location.pathname === "/admin/solutions" ? "active" : ""
            }`}
            onClick={() => setAdminMenuOpen(false)}
          >
            <i className="fas fa-video" style={{ marginRight: "6px" }}></i> Add
            Solutions
          </Link>
          <Link
            to="/admin/users"
            className={`admin-dropdown-item ${
              location.pathname === "/admin/users" ? "active" : ""
            }`}
            onClick={() => setAdminMenuOpen(false)}
          >
            <i className="fas fa-users-cog" style={{ marginRight: "6px" }}></i>{" "}
            Manage Users
          </Link>
        </div>
      )}
    </div>
  );
  const authLinks = (
    <>
      {isAdmin ? <AdminDropdown /> : null}
      <Link
        to="/account"
        className={`nav-link ${
          location.pathname === "/account" ? "active" : ""
        }`}
      >
        <i className="fas fa-user-cog" style={{ marginRight: "6px" }}></i>{" "}
        Account
      </Link>
      <button className="nav-link logout-link" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt" style={{ marginRight: "6px" }}></i>{" "}
        Logout
      </button>
    </>
  );
  const guestLinks = (
    <>
      <Link
        to="/register"
        className={`nav-link ${
          location.pathname === "/register" ? "active" : ""
        }`}
      >
        <i className="fas fa-user-plus" style={{ marginRight: "6px" }}></i> Sign
        Up
      </Link>
      <Link
        to="/login"
        className={`nav-link ${location.pathname === "/login" ? "active" : ""}`}
      >
        <i className="fas fa-sign-in-alt" style={{ marginRight: "6px" }}></i>{" "}
        Sign In
      </Link>
    </>
  );
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <i className="fas fa-code"></i>
          <span>Contest Tracker</span>
        </Link>
        <div className="navbar-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
          >
            <i className="fas fa-list-ul" style={{ marginRight: "6px" }}></i>{" "}
            Contests
          </Link>
          <Link
            to="/bookmarks"
            className={`nav-link ${
              location.pathname === "/bookmarks" ? "active" : ""
            }`}
          >
            <i className="fas fa-bookmark" style={{ marginRight: "6px" }}></i>{" "}
            Bookmarks
          </Link>
          {isAuthenticated ? authLinks : guestLinks}
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? (
              <>
                <i className="fas fa-moon"></i> Dark
              </>
            ) : (
              <>
                <i className="fas fa-sun"></i> Light
              </>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
