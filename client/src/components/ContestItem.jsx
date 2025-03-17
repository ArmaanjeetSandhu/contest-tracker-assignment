import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { setReminder, deleteReminder } from "../redux/remindersSlice";
function ContestItem({ contest, isBookmarked, onBookmarkToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { reminders } = useSelector((state) => state.reminders);
  const [showReminderDropdown, setShowReminderDropdown] = useState(false);
  const existingReminder = reminders.find(
    (reminder) => reminder.contestId && reminder.contestId._id === contest._id
  );
  const {
    _id,
    name,
    platform,
    startTime,
    endTime,
    url,
    status,
    duration,
    solutionUrl,
  } = contest;
  const startDate = React.useMemo(() => new Date(startTime), [startTime]);
  const endDate = React.useMemo(() => new Date(endTime), [endTime]);
  const formatDate = (date) => {
    const dateObj = new Date(date);
    if (platform === "CodeChef") {
      const fixedDate = new Date(dateObj);
      fixedDate.setDate(fixedDate.getDate() + 1);
      return format(fixedDate, "MMM dd, yyyy");
    }
    return format(dateObj, "MMM dd, yyyy");
  };
  const formatTime = (date) => {
    return format(date, "h:mm a");
  };
  const getTimeRemaining = () => {
    if (status === "past") {
      return "Ended";
    } else if (status === "ongoing") {
      return `Ends in ${formatDistanceToNow(endDate)}`;
    } else {
      return `Starts in ${formatDistanceToNow(startDate)}`;
    }
  };
  const getDuration = () => {
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
        return "Duration unknown";
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
    } catch (e) {
      console.error("Error formatting duration:", e);
      return "Duration unknown";
    }
  };
  const getPlatformIcon = () => {
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
  const getPlatformClass = () => {
    return `platform-${platform.toLowerCase()}`;
  };
  const handleBookmarkToggle = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    onBookmarkToggle(_id);
  };
  const toggleReminderDropdown = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setShowReminderDropdown(!showReminderDropdown);
  };
  const handleSetReminder = (reminderTime) => {
    dispatch(setReminder({ contestId: _id, reminderTime }));
    setShowReminderDropdown(false);
  };
  const handleDeleteReminder = () => {
    if (existingReminder) {
      dispatch(deleteReminder(existingReminder._id));
    }
  };
  React.useEffect(() => {
    const verifyTiming = () => {
      if (!startDate || !endDate) return true;
      const actualDuration = Math.round((endDate - startDate) / (60 * 1000));
      const storedDuration = parseInt(duration);
      console.log(`Contest: ${name} (${platform})`);
      console.log(`Start: ${startDate.toISOString()}`);
      console.log(`End: ${endDate.toISOString()}`);
      console.log(`Stored Duration: ${storedDuration} minutes`);
      console.log(`Actual Duration: ${actualDuration} minutes`);
      return Math.abs(actualDuration - storedDuration) <= 1;
    };
    verifyTiming();
  }, [startDate, endDate, duration, name, platform]);
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowReminderDropdown(false);
    };
    if (showReminderDropdown) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showReminderDropdown]);
  return (
    <div className={`contest-card ${status}`}>
      <div className="contest-top">
        <div className={`platform-badge ${getPlatformClass()}`}>
          <i className={getPlatformIcon()}></i> {platform}
        </div>
        <div className="contest-actions">
          <button
            className={`bookmark-btn ${isBookmarked ? "bookmarked" : ""}`}
            onClick={handleBookmarkToggle}
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <i
              className={isBookmarked ? "fas fa-bookmark" : "far fa-bookmark"}
            ></i>
          </button>
          {status === "upcoming" && (
            <div
              className="reminder-container"
              onClick={(e) => e.stopPropagation()}
            >
              {existingReminder ? (
                <button
                  className="reminder-btn active"
                  onClick={handleDeleteReminder}
                  title={`Reminder set for ${
                    existingReminder.reminderTime === "30min"
                      ? "30 minutes"
                      : "1 hour"
                  } before the contest`}
                >
                  <i className="fas fa-bell"></i>
                </button>
              ) : (
                <button
                  className="reminder-btn"
                  onClick={toggleReminderDropdown}
                  title="Set a reminder"
                >
                  <i className="far fa-bell"></i>
                </button>
              )}
              {showReminderDropdown && (
                <div className="reminder-dropdown">
                  <div className="reminder-dropdown-title">Set reminder</div>
                  <button
                    className="reminder-option"
                    onClick={() => handleSetReminder("30min")}
                  >
                    30 minutes before
                  </button>
                  <button
                    className="reminder-option"
                    onClick={() => handleSetReminder("1hour")}
                  >
                    1 hour before
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <h3 className="contest-name">{name}</h3>
      <div className="contest-details">
        <div className="detail-item">
          <span className="detail-label">Status:</span>
          <span className={`status-badge ${status}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Start:</span>
          <span>
            {formatDate(startDate)} at {formatTime(startDate)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">End:</span>
          <span>
            {formatDate(endDate)} at {formatTime(endDate)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Duration:</span>
          <span>{getDuration()}</span>
        </div>
        {status !== "past" && (
          <div className="time-remaining">
            <i className="far fa-clock"></i> {getTimeRemaining()}
          </div>
        )}
      </div>
      <div className="contest-footer">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="contest-link"
        >
          Visit Contest{" "}
          <i
            className="fas fa-external-link-alt"
            style={{ marginLeft: "5px" }}
          ></i>
        </a>
        {/* Add solution link if available and contest is past */}
        {status === "past" && solutionUrl && (
          <a
            href={solutionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="solution-link"
          >
            Watch Solution{" "}
            <i className="fab fa-youtube" style={{ marginLeft: "5px" }}></i>
          </a>
        )}
      </div>
    </div>
  );
}
export default ContestItem;
