import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API_URL = "http://localhost:5000/api";
export const fetchAllContests = createAsyncThunk(
  "contests/fetchAll",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.platforms && filters.platforms.length > 0) {
        queryParams.append("platforms", filters.platforms.join(","));
      }
      if (filters.status && filters.status.length > 0) {
        queryParams.append("status", filters.status.join(","));
      }
      if (filters.status && filters.status.includes("past")) {
        queryParams.append("lastWeekOnly", "true");
      }
      const queryString = queryParams.toString();
      const url = `${API_URL}/contests${queryString ? `?${queryString}` : ""}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const fetchUpcomingContests = createAsyncThunk(
  "contests/fetchUpcoming",
  async (platforms = [], { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (platforms && platforms.length > 0) {
        queryParams.append("platforms", platforms.join(","));
      }
      const queryString = queryParams.toString();
      const url = `${API_URL}/contests/upcoming${
        queryString ? `?${queryString}` : ""
      }`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const fetchOngoingContests = createAsyncThunk(
  "contests/fetchOngoing",
  async (platforms = [], { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (platforms && platforms.length > 0) {
        queryParams.append("platforms", platforms.join(","));
      }
      const queryString = queryParams.toString();
      const url = `${API_URL}/contests/ongoing${
        queryString ? `?${queryString}` : ""
      }`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const fetchPastContests = createAsyncThunk(
  "contests/fetchPast",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { platforms = [], limit, lastWeekOnly = true } = params;
      const queryParams = new URLSearchParams();
      if (platforms && platforms.length > 0) {
        queryParams.append("platforms", platforms.join(","));
      }
      if (limit) {
        queryParams.append("limit", limit);
      }
      queryParams.append("lastWeekOnly", String(lastWeekOnly));
      const queryString = queryParams.toString();
      const url = `${API_URL}/contests/past${
        queryString ? `?${queryString}` : ""
      }`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const updateContests = createAsyncThunk(
  "contests/update",
  async (_, { rejectWithValue }) => {
    try {
      await axios.post(`${API_URL}/contests/update`);
      const response = await axios.get(`${API_URL}/contests`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const getContestById = createAsyncThunk(
  "contests/getById",
  async (contestId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/contests/${contestId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const updateContestSolution = createAsyncThunk(
  "contests/updateSolution",
  async ({ contestId, solutionUrl }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/contests/${contestId}/solution`,
        { solutionUrl }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
const contestsSlice = createSlice({
  name: "contests",
  initialState: {
    allContests: [],
    upcomingContests: [],
    ongoingContests: [],
    pastContests: [],
    filteredContests: [],
    selectedContest: null,
    loading: false,
    refreshing: false,
    error: null,
    filters: {
      platforms: ["Codeforces", "CodeChef", "Leetcode"],
      status: ["upcoming", "ongoing", "past"],
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    applyFilters: (state) => {
      state.filteredContests = state.allContests.filter((contest) => {
        if (!state.filters.platforms.includes(contest.platform)) {
          return false;
        }
        if (!state.filters.status.includes(contest.status)) {
          return false;
        }
        if (contest.status === "past") {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return new Date(contest.endTime) >= oneWeekAgo;
        }
        return true;
      });
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedContest: (state) => {
      state.selectedContest = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllContests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllContests.fulfilled, (state, action) => {
        state.loading = false;
        state.allContests = action.payload;
        state.filteredContests = action.payload.filter((contest) => {
          if (!state.filters.platforms.includes(contest.platform)) {
            return false;
          }
          if (!state.filters.status.includes(contest.status)) {
            return false;
          }
          if (contest.status === "past") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return new Date(contest.endTime) >= oneWeekAgo;
          }
          return true;
        });
      })
      .addCase(fetchAllContests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch contests";
      })
      .addCase(fetchUpcomingContests.pending, (state) => {
        state.loading = !state.allContests.length;
      })
      .addCase(fetchUpcomingContests.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingContests = action.payload;
      })
      .addCase(fetchUpcomingContests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch upcoming contests";
      })
      .addCase(fetchOngoingContests.fulfilled, (state, action) => {
        state.ongoingContests = action.payload;
      })
      .addCase(fetchPastContests.fulfilled, (state, action) => {
        state.pastContests = action.payload;
      })
      .addCase(updateContests.pending, (state) => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(updateContests.fulfilled, (state, action) => {
        state.refreshing = false;
        state.allContests = action.payload;
        state.filteredContests = action.payload.filter((contest) => {
          if (!state.filters.platforms.includes(contest.platform)) {
            return false;
          }
          if (!state.filters.status.includes(contest.status)) {
            return false;
          }
          if (contest.status === "past") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return new Date(contest.endTime) >= oneWeekAgo;
          }
          return true;
        });
      })
      .addCase(updateContests.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload || "Failed to update contests";
      })
      .addCase(getContestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getContestById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedContest = action.payload;
      })
      .addCase(getContestById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch contest details";
      })
      .addCase(updateContestSolution.fulfilled, (state, action) => {
        const updatedContest = action.payload;
        const allIndex = state.allContests.findIndex(
          (c) => c._id === updatedContest._id
        );
        if (allIndex !== -1) {
          state.allContests[allIndex].solutionUrl = updatedContest.solutionUrl;
        }
        const filteredIndex = state.filteredContests.findIndex(
          (c) => c._id === updatedContest._id
        );
        if (filteredIndex !== -1) {
          state.filteredContests[filteredIndex].solutionUrl =
            updatedContest.solutionUrl;
        }
        const pastIndex = state.pastContests.findIndex(
          (c) => c._id === updatedContest._id
        );
        if (pastIndex !== -1) {
          state.pastContests[pastIndex].solutionUrl =
            updatedContest.solutionUrl;
        }
        if (
          state.selectedContest &&
          state.selectedContest._id === updatedContest._id
        ) {
          state.selectedContest.solutionUrl = updatedContest.solutionUrl;
        }
      });
  },
});
export const { setFilters, applyFilters, clearError, clearSelectedContest } =
  contestsSlice.actions;
export default contestsSlice.reducer;
