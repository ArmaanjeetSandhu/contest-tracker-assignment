import { format } from "date-fns";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
function ContestTableView({ contests, isBookmarkedFunc, onBookmarkToggle }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [sortConfig, setSortConfig] = useState({
    key: "startTime",
    direction: "ascending",
  });
  const formatDate = (date) => {
    return format(new Date(date), "MMM dd, yyyy");
  };
  const formatTime = (date) => {
    return format(new Date(date), "h:mm a");
  };
  const getDuration = (startTime, endTime, duration) => {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (!isNaN(startDate) && !isNaN(endDate)) {
      const calculatedMinutes = Math.round((endDate - startDate) / (60 * 1000));
      const hours = Math.floor(calculatedMinutes / 60);
      const minutes = calculatedMinutes % 60;
      if (hours === 0) {
        return `${minutes} min`;
      } else if (minutes === 0) {
        return `${hours} hr`;
      } else {
        return `${hours} hr ${minutes} min`;
      }
    }
    try {
      const durationMinutes = parseInt(duration);
      if (isNaN(durationMinutes)) {
        return "Unknown";
      }
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      if (hours === 0) {
        return `${minutes} min`;
      } else if (minutes === 0) {
        return `${hours} hr`;
      } else {
        return `${hours} hr ${minutes} min`;
      }
    } catch {
      return "Unknown";
    }
  };
  const getDurationMinutes = (startTime, endTime, duration) => {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (!isNaN(startDate) && !isNaN(endDate)) {
      return Math.round((endDate - startDate) / (60 * 1000));
    }
    try {
      return parseInt(duration);
    } catch {
      return 0;
    }
  };
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case "Codeforces":
        return "fas fa-code";
      case "CodeChef":
        return "fas fa-utensils";
      case "Leetcode":
        return "fas fa-laptop-code";
      default:
        return "fas fa-globe";
    }
  };
  const handleBookmarkToggle = (contestId) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    onBookmarkToggle(contestId);
  };
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  const sortedContests = useMemo(() => {
    let sortableContests = [...contests];
    if (sortConfig.key) {
      sortableContests.sort((a, b) => {
        let aValue, bValue;
        switch (sortConfig.key) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "platform":
            aValue = a.platform.toLowerCase();
            bValue = b.platform.toLowerCase();
            break;
          case "startTime":
            aValue = new Date(a.startTime).getTime();
            bValue = new Date(b.startTime).getTime();
            break;
          case "endTime":
            aValue = new Date(a.endTime).getTime();
            bValue = new Date(b.endTime).getTime();
            break;
          case "duration":
            aValue = getDurationMinutes(a.startTime, a.endTime, a.duration);
            bValue = getDurationMinutes(b.startTime, b.endTime, b.duration);
            break;
          case "status": {
            const statusOrder = { ongoing: 0, upcoming: 1, past: 2 };
            aValue = statusOrder[a.status];
            bValue = statusOrder[b.status];
            break;
          }
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableContests;
  }, [contests, sortConfig]);
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? (
        <i className="fas fa-sort-up ml-1"></i>
      ) : (
        <i className="fas fa-sort-down ml-1"></i>
      );
    }
    return <i className="fas fa-sort ml-1 text-muted"></i>;
  };
  return (
    <div className="contest-table-wrapper">
      <table className="contest-table">
        <thead>
          <tr>
            <th onClick={() => requestSort("name")} className="sortable-header">
              Name {getSortIndicator("name")}
            </th>
            <th
              onClick={() => requestSort("platform")}
              className="sortable-header"
            >
              Platform {getSortIndicator("platform")}
            </th>
            <th
              onClick={() => requestSort("startTime")}
              className="sortable-header"
            >
              Start Date {getSortIndicator("startTime")}
            </th>
            <th
              onClick={() => requestSort("endTime")}
              className="sortable-header"
            >
              End Date {getSortIndicator("endTime")}
            </th>
            <th
              onClick={() => requestSort("duration")}
              className="sortable-header"
            >
              Duration {getSortIndicator("duration")}
            </th>
            <th
              onClick={() => requestSort("status")}
              className="sortable-header"
            >
              Status {getSortIndicator("status")}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedContests.map((contest) => (
            <tr key={contest._id} className={contest.status}>
              <td className="contest-name-cell">{contest.name}</td>
              <td>
                <span
                  className={`platform-label-small platform-${contest.platform.toLowerCase()}`}
                >
                  <i className={getPlatformIcon(contest.platform)}></i>{" "}
                  {contest.platform}
                </span>
              </td>
              <td>
                {formatDate(contest.startTime)}
                <div className="time-small">
                  {formatTime(contest.startTime)}
                </div>
              </td>
              <td>
                {formatDate(contest.endTime)}
                <div className="time-small">{formatTime(contest.endTime)}</div>
              </td>
              <td>
                {getDuration(
                  contest.startTime,
                  contest.endTime,
                  contest.duration
                )}
              </td>
              <td>
                <span className={`status-badge ${contest.status}`}>
                  {contest.status.charAt(0).toUpperCase() +
                    contest.status.slice(1)}
                </span>
              </td>
              <td className="actions-cell">
                <div className="table-actions">
                  <button
                    className={`bookmark-btn-small ${
                      isBookmarkedFunc(contest._id) ? "bookmarked" : ""
                    }`}
                    onClick={() => handleBookmarkToggle(contest._id)}
                    aria-label={
                      isBookmarkedFunc(contest._id)
                        ? "Remove bookmark"
                        : "Add bookmark"
                    }
                  >
                    <i
                      className={
                        isBookmarkedFunc(contest._id)
                          ? "fas fa-bookmark"
                          : "far fa-bookmark"
                      }
                    ></i>
                  </button>
                  <a
                    href={contest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contest-link-small"
                    title="Visit Contest"
                  >
                    <i className="fas fa-external-link-alt"></i>
                  </a>
                  {contest.status === "past" && contest.solutionUrl && (
                    <a
                      href={contest.solutionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="solution-link-small"
                      title="Watch Solution"
                    >
                      <i className="fab fa-youtube"></i>
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default ContestTableView;
