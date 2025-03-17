import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "./App.css";
import Navbar from "./components/Navbar";
import ContestList from "./components/ContestList";
import Bookmarks from "./components/Bookmarks";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import AdminPanel from "./components/auth/AdminPanel";
import SolutionUrlForm from "./components/SolutionUrlForm";
import UserManagement from "./components/admin/UserManagement";
import AccountSettings from "./components/AccountSettings";
import PrivateRoute from "./components/routing/PrivateRoute";
import AdminRoute from "./components/routing/AdminRoute";
import { loadUser } from "./redux/authSlice";
import { fetchBookmarks } from "./redux/bookmarksSlice";
import { fetchReminders } from "./redux/remindersSlice";
import { ThemeProvider } from "./context/ThemeProvider";
import "./styles/main.css";
import "./styles/Auth.css";
import "./styles/SolutionForm.css";
import "./styles/UserManagement.css";
import "./styles/AccountSettings.css";
function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchBookmarks());
      dispatch(fetchReminders());
    }
  }, [isAuthenticated, dispatch]);
  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/" element={<ContestList />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* Private routes - requires authentication */}
              <Route element={<PrivateRoute />}>
                {/* Admin routes - requires admin role */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin/panel" element={<AdminPanel />} />
                  <Route
                    path="/admin/solutions"
                    element={<SolutionUrlForm />}
                  />
                  <Route path="/admin/users" element={<UserManagement />} />
                </Route>
                {/* User routes - for all authenticated users */}
                <Route path="/account" element={<AccountSettings />} />
              </Route>
              {/* Catch-all route - redirects to home */}
              <Route path="*" element={<ContestList />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}
export default App;
