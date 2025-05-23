import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  clearBookmarkError,
  fetchBookmarks,
  toggleBookmark,
} from "../redux/bookmarksSlice";
import ContestItem from "./ContestItem";
import ContestTableView from "./ContestTableView";
import ViewToggle from "./ViewToggle";
function Bookmarks() {
  const dispatch = useDispatch();
  const { bookmarks, loading, error } = useSelector((state) => state.bookmarks);
  const [activeStatus, setActiveStatus] = useState("all");
  const [viewMode, setViewMode] = useState("card");
  useEffect(() => {
    const savedView = localStorage.getItem("preferredView");
    if (savedView && (savedView === "card" || savedView === "table")) {
      setViewMode(savedView);
    }
    dispatch(fetchBookmarks());
    return () => {
      dispatch(clearBookmarkError());
    };
  }, [dispatch]);
  const handleViewChange = (newView) => {
    setViewMode(newView);
    localStorage.setItem("preferredView", newView);
  };
  const handleBookmarkToggle = (contestId) => {
    dispatch(toggleBookmark(contestId));
  };
  const getFilteredBookmarks = () => {
    if (activeStatus === "all") {
      return bookmarks;
    } else {
      return bookmarks.filter(
        (bookmark) =>
          bookmark.contestId && bookmark.contestId.status === activeStatus
      );
    }
  };
  if (loading && bookmarks.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading bookmarks...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading bookmarks</h3>
        <p>{error}</p>
        <button className="btn" onClick={() => dispatch(fetchBookmarks())}>
          <i className="fas fa-sync-alt"></i> Try Again
        </button>
      </div>
    );
  }
  const filteredBookmarks = getFilteredBookmarks();
  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <div className="bookmarks-title">
          <h2>
            <i className="fas fa-bookmark"></i> Bookmarked Contests
          </h2>
        </div>
        {bookmarks.length > 0 && (
          <div className="view-toggle-container">
            <ViewToggle
              currentView={viewMode}
              onViewChange={handleViewChange}
            />
          </div>
        )}
      </div>
      {bookmarks.length === 0 ? (
        <div className="no-bookmarks">
          <i className="far fa-bookmark empty-bookmark"></i>
          <h3>No bookmarks yet</h3>
          <p>Save contests to your bookmarks for easy access.</p>
          <Link to="/" className="btn">
            <i className="fas fa-search"></i> Browse Contests
          </Link>
        </div>
      ) : (
        <>
          <div className="tab-container">
            <div className="tabs">
              <button
                className={`tab ${activeStatus === "all" ? "active" : ""}`}
                onClick={() => setActiveStatus("all")}
              >
                All Bookmarks
              </button>
              <button
                className={`tab ${activeStatus === "upcoming" ? "active" : ""}`}
                onClick={() => setActiveStatus("upcoming")}
              >
                Upcoming
              </button>
              <button
                className={`tab ${activeStatus === "ongoing" ? "active" : ""}`}
                onClick={() => setActiveStatus("ongoing")}
              >
                Ongoing
              </button>
              <button
                className={`tab ${activeStatus === "past" ? "active" : ""}`}
                onClick={() => setActiveStatus("past")}
              >
                Past
              </button>
            </div>
          </div>
          {filteredBookmarks.length === 0 ? (
            <div className="no-filtered-bookmarks">
              <p>
                No {activeStatus !== "all" ? activeStatus : ""} bookmarks found
              </p>
              <button className="btn" onClick={() => setActiveStatus("all")}>
                Show All Bookmarks
              </button>
            </div>
          ) : (
            <>
              {viewMode === "card" && (
                <div className="contest-grid">
                  {filteredBookmarks.map((bookmark) =>
                    bookmark.contestId ? (
                      <ContestItem
                        key={bookmark._id}
                        contest={bookmark.contestId}
                        isBookmarked={true}
                        onBookmarkToggle={() =>
                          handleBookmarkToggle(bookmark.contestId._id)
                        }
                      />
                    ) : null
                  )}
                </div>
              )}
              {viewMode === "table" && (
                <ContestTableView
                  contests={filteredBookmarks
                    .map((bookmark) => bookmark.contestId)
                    .filter(Boolean)}
                  isBookmarkedFunc={() => true}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
export default Bookmarks;
