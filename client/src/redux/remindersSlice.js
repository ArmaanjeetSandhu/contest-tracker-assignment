import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../utils/apiConfig";
export const fetchReminders = createAsyncThunk(
  "reminders/fetchAll",
  async (_, { rejectWithValue, getState }) => {
    try {
      const userId = getState().auth.user?._id;
      if (!userId) {
        console.log("No user ID found, skipping reminders fetch");
        return [];
      }
      console.log(`Fetching reminders for user: ${userId}`);
      const response = await axios.get(`${API_URL}/reminders/${userId}`);
      console.log(`Fetched ${response.data.length} reminders`);
      return response.data;
    } catch (error) {
      console.error("Error fetching reminders:", error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const setReminder = createAsyncThunk(
  "reminders/set",
  async (
    { contestId, reminderTime },
    { rejectWithValue, getState }
  ) => {
    try {
      const userId = getState().auth.user?._id;
      if (!userId) {
        console.error("User ID not found in state");
        return rejectWithValue(
          "User not authenticated or user data not loaded"
        );
      }
      console.log(
        `Setting reminder for contestId: ${contestId}, userId: ${userId}, time: ${reminderTime}`
      );
      const response = await axios.post(`${API_URL}/reminders`, {
        userId,
        contestId,
        reminderTime,
      });
      console.log("Reminder set response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error setting reminder:", error);
      const errorMessage = error.response?.data?.message || error.message;
      // If it's a specific error about contest already started, provide a clearer message
      if (errorMessage.includes("already started")) {
        return rejectWithValue(
          "Cannot set a reminder for a contest that has already started"
        );
      }
      return rejectWithValue(errorMessage);
    }
  }
);
export const deleteReminder = createAsyncThunk(
  "reminders/delete",
  async (reminderId, { rejectWithValue }) => {
    try {
      console.log(`Deleting reminder with ID: ${reminderId}`);
      const response = await axios.delete(`${API_URL}/reminders/${reminderId}`);
      console.log("Reminder delete response:", response.data);
      return response.data.reminderId;
    } catch (error) {
      console.error("Error deleting reminder:", error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
const remindersSlice = createSlice({
  name: "reminders",
  initialState: {
    reminders: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearReminderError: (state) => {
      state.error = null;
    },
    clearReminders: (state) => {
      state.reminders = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.loading = false;
        state.reminders = action.payload;
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch reminders";
      })
      .addCase(setReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setReminder.fulfilled, (state, action) => {
        state.loading = false;
        const existingIndex = state.reminders.findIndex(
          (reminder) =>
            reminder.contestId?._id === action.payload.contestId?._id
        );
        if (existingIndex !== -1) {
          state.reminders[existingIndex] = action.payload;
        } else {
          state.reminders.push(action.payload);
        }
      })
      .addCase(setReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to set reminder";
      })
      .addCase(deleteReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.loading = false;
        state.reminders = state.reminders.filter(
          (reminder) => reminder._id !== action.payload
        );
      })
      .addCase(deleteReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete reminder";
      });
  },
});
export const { clearReminderError, clearReminders } = remindersSlice.actions;
export default remindersSlice.reducer;
