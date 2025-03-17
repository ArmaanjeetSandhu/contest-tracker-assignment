import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API_URL = "http://localhost:5000/api";
export const fetchBookmarks = createAsyncThunk(
  "bookmarks/fetchAll",
  async (_, { rejectWithValue, getState }) => {
    try {
      const userId = getState().auth.user?._id;
      if (!userId) {
        console.log("No user ID found, skipping bookmark fetch");
        return [];
      }
      console.log(`Fetching bookmarks for user: ${userId}`);
      const response = await axios.get(`${API_URL}/bookmarks/${userId}`);
      console.log(`Fetched ${response.data.length} bookmarks`);
      return response.data;
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const toggleBookmark = createAsyncThunk(
  "bookmarks/toggle",
  async (contestId, { rejectWithValue, getState }) => {
    try {
      const userId = getState().auth.user?._id;
      if (!userId) {
        return rejectWithValue("User not authenticated");
      }
      console.log(
        `Toggling bookmark for contestId: ${contestId}, userId: ${userId}`
      );
      const response = await axios.post(`${API_URL}/bookmarks/toggle`, {
        userId,
        contestId,
      });
      console.log("Bookmark toggle response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const addBookmark = createAsyncThunk(
  "bookmarks/add",
  async (contestId, { rejectWithValue, getState }) => {
    try {
      const userId = getState().auth.user?._id;
      if (!userId) {
        return rejectWithValue("User not authenticated");
      }
      const response = await axios.post(`${API_URL}/bookmarks`, {
        userId,
        contestId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const removeBookmark = createAsyncThunk(
  "bookmarks/remove",
  async (bookmarkId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/bookmarks/${bookmarkId}`);
      return bookmarkId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
const bookmarksSlice = createSlice({
  name: "bookmarks",
  initialState: {
    bookmarks: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearBookmarkError: (state) => {
      state.error = null;
    },
    clearBookmarks: (state) => {
      state.bookmarks = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookmarks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        state.loading = false;
        state.bookmarks = action.payload;
      })
      .addCase(fetchBookmarks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch bookmarks";
      })
      .addCase(toggleBookmark.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        if (action.payload.bookmarked) {
          state.bookmarks.push(action.payload.bookmark);
        } else {
          state.bookmarks = state.bookmarks.filter(
            (bookmark) => bookmark._id !== action.payload.bookmarkId
          );
        }
      })
      .addCase(toggleBookmark.rejected, (state, action) => {
        state.error = action.payload || "Failed to toggle bookmark";
      })
      .addCase(addBookmark.fulfilled, (state, action) => {
        state.bookmarks.push(action.payload);
      })
      .addCase(addBookmark.rejected, (state, action) => {
        state.error = action.payload || "Failed to add bookmark";
      })
      .addCase(removeBookmark.fulfilled, (state, action) => {
        state.bookmarks = state.bookmarks.filter(
          (bookmark) => bookmark._id !== action.payload
        );
      })
      .addCase(removeBookmark.rejected, (state, action) => {
        state.error = action.payload || "Failed to remove bookmark";
      });
  },
});
export const { clearBookmarkError, clearBookmarks } = bookmarksSlice.actions;
export default bookmarksSlice.reducer;
