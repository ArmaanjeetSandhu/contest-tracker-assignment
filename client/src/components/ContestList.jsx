import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllContests,
  fetchUpcomingContests,
  fetchOngoingContests,
  fetchPastContests,
  setFilters,
  applyFilters,
  updateContests,
  clearError,
} from "../redux/contestsSlice";
import { fetchBookmarks, toggleBookmark } from "../redux/bookmarksSlice";
import ContestItem from "./ContestItem";
import FilterPanel from "./FilterPanel";
function ContestList() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { filteredContests, loading, refreshing, error, filters } = useSelector(
    (state) => state.contests
  );
  const { bookmarks } = useSelector((state) => state.bookmarks);
  const [activeTab, setActiveTab] = useState("upcoming");
  useEffect(() => {
    dispatch(fetchAllContests());
    dispatch(fetchBookmarks());
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);
  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
    dispatch(applyFilters());
  };
  const handleBookmarkToggle = (contestId) => {
    if (isAuthenticated) {
      dispatch(toggleBookmark(contestId))
        .unwrap()
        .catch((error) => {
          console.error("Error toggling bookmark:", error);
        });
    } else {
      console.log("User must be logged in to bookmark contests");
    }
  };
  const isBookmarked = (contestId) => {
    return bookmarks.some(
      (bookmark) => bookmark.contestId && bookmark.contestId._id === contestId
    );
  };
  const getFilteredContests = () => {
    if (activeTab === "all") {
      return filteredContests;
    } else {
      return filteredContests.filter((contest) => contest.status === activeTab);
    }
  };
  const handleRefresh = () => {
    dispatch(updateContests());
  };
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "past" && !filters.status.includes("past")) {
      const newFilters = {
        ...filters,
        status: [...filters.status, "past"],
      };
      dispatch(setFilters(newFilters));
    }
    switch (tab) {
      case "upcoming":
        dispatch(fetchUpcomingContests(filters.platforms));
        break;
      case "ongoing":
        dispatch(fetchOngoingContests(filters.platforms));
        break;
      case "past":
        dispatch(
          fetchPastContests({
            platforms: filters.platforms,
            limit: 20,
            lastWeekOnly: true,
          })
        );
        break;
      case "all":
      default:
        break;
    }
  };
  if (loading && filteredContests.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading contests...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading contests</h3>
        <p>{error}</p>
        <button className="btn" onClick={handleRefresh}>
          <i className="fas fa-sync-alt"></i> Try Again
        </button>
      </div>
    );
  }
  const displayedContests = getFilteredContests();
  return (
    <div className="contest-list">
      {/* Show refreshing indicator if applicable */}
      {refreshing && (
        <div className="refreshing-indicator">
          <div className="loading-spinner"></div>
          <p>Refreshing contests...</p>
        </div>
      )}
      <div className="contest-header">
        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
      </div>
      <div className="tab-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => handleTabChange("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`tab ${activeTab === "ongoing" ? "active" : ""}`}
            onClick={() => handleTabChange("ongoing")}
          >
            Ongoing
          </button>
          <button
            className={`tab ${activeTab === "past" ? "active" : ""}`}
            onClick={() => handleTabChange("past")}
          >
            Past (Last Week)
          </button>
          <button
            className={`tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => handleTabChange("all")}
          >
            All Contests
          </button>
        </div>
      </div>
      {displayedContests.length === 0 ? (
        <div className="no-contests">
          <p>No contests found</p>
          <small>
            {activeTab === "past"
              ? "No contests ended in the last week that match your filters"
              : "Try changing your filters or refreshing the data"}
          </small>
          <button className="btn refresh-btn" onClick={handleRefresh}>
            <i className="fas fa-sync-alt"></i> Refresh Data
          </button>
        </div>
      ) : (
        <div className="contest-grid">
          {displayedContests.map((contest) => (
            <ContestItem
              key={contest._id}
              contest={contest}
              isBookmarked={isBookmarked(contest._id)}
              onBookmarkToggle={() => handleBookmarkToggle(contest._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export default ContestList;
