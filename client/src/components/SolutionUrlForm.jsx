import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPastContests,
  updateContestSolution,
} from "../redux/contestsSlice";
function SolutionUrlForm() {
  const dispatch = useDispatch();
  const { pastContests, loading, error } = useSelector(
    (state) => state.contests
  );
  const [selectedContest, setSelectedContest] = useState("");
  const [solutionUrl, setSolutionUrl] = useState("");
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  useEffect(() => {
    dispatch(
      fetchPastContests({
        limit: 100,
        lastWeekOnly: false,
      })
    );
  }, [dispatch]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContest || !solutionUrl) {
      setMessage({
        type: "error",
        text: "Please select a contest and enter a solution URL",
      });
      return;
    }
    try {
      await dispatch(
        updateContestSolution({
          contestId: selectedContest,
          solutionUrl,
        })
      ).unwrap();
      setMessage({ type: "success", text: "Solution URL added successfully!" });
      setSolutionUrl("");
      setSelectedContest("");
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error || "Failed to update solution URL",
      });
    }
  };
  const filteredContests = pastContests.filter((contest) => {
    const nameMatch = contest.name.toLowerCase().includes(filter.toLowerCase());
    const platformMatch =
      platformFilter === "all" || contest.platform === platformFilter;
    return nameMatch && platformMatch;
  });
  const sortedContests = [...filteredContests].sort(
    (a, b) => new Date(b.endTime) - new Date(a.endTime)
  );
  return (
    <div className="solution-form-container">
      <h2>Add YouTube Solution URL for Past Contests</h2>
      <p>
        Use this form to add solution video links to past programming contests.
      </p>
      {loading && pastContests.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading past contests...</p>
        </div>
      ) : (
        <div className="solution-form-wrapper">
          <div className="filter-section">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="name-filter">Filter by Name:</label>
                <input
                  id="name-filter"
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Type to filter contests..."
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label htmlFor="platform-filter">Filter by Platform:</label>
                <select
                  id="platform-filter"
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="platform-select"
                >
                  <option value="all">All Platforms</option>
                  <option value="Codeforces">Codeforces</option>
                  <option value="CodeChef">CodeChef</option>
                  <option value="Leetcode">Leetcode</option>
                </select>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="solution-form">
            <div className="form-group">
              <label htmlFor="contest-select">Select Contest:</label>
              <select
                id="contest-select"
                value={selectedContest}
                onChange={(e) => setSelectedContest(e.target.value)}
                required
                className="contest-select"
              >
                <option value="">-- Select a past contest --</option>
                {sortedContests.map((contest) => (
                  <option key={contest._id} value={contest._id}>
                    {contest.name} ({contest.platform})
                    {contest.solutionUrl ? " - Has solution" : ""}
                  </option>
                ))}
              </select>
              <small className="select-info">
                {`Showing ${sortedContests.length} contests`}
                {filter || platformFilter !== "all" ? " (filtered)" : ""}
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="solution-url">YouTube Solution URL:</label>
              <input
                id="solution-url"
                type="url"
                value={solutionUrl}
                onChange={(e) => setSolutionUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="url-input"
              />
              <small className="url-info">
                Enter a valid YouTube URL for the contest solution video
              </small>
            </div>
            <button type="submit" className="btn btn-primary submit-btn">
              Save Solution URL
            </button>
            {message && (
              <div className={`message message-${message.type}`}>
                {message.type === "success" ? (
                  <i className="fas fa-check-circle"></i>
                ) : (
                  <i className="fas fa-exclamation-circle"></i>
                )}
                {message.text}
              </div>
            )}
          </form>
        </div>
      )}
      {error && (
        <div className="error-container">
          <h3>Error loading contests</h3>
          <p>{error}</p>
          <button
            className="btn"
            onClick={() =>
              dispatch(fetchPastContests({ limit: 100, lastWeekOnly: false }))
            }
          >
            <i className="fas fa-sync-alt"></i> Try Again
          </button>
        </div>
      )}
    </div>
  );
}
export default SolutionUrlForm;
