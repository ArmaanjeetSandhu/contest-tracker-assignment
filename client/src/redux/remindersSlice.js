import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API_URL = "http://localhost:5000/api";
export const fetchReminders = createAsyncThunk(
  "reminders/fetchAll",
  async (_, { rejectWithValue, getState }) => {
    try {
      const userId = getState().auth.user?._id;
      if (!userId) {
        return [];
      }
      const response = await axios.get(`${API_URL}/reminders/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const setReminder = createAsyncThunk(
  "reminders/set",
  async ({ contestId, reminderTime }, { rejectWithValue, getState }) => {
    try {
      const userId = getState().auth.user?._id;
      if (!userId) {
        return rejectWithValue("User not authenticated");
      }
      const response = await axios.post(`${API_URL}/reminders`, {
        userId,
        contestId,
        reminderTime,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const deleteReminder = createAsyncThunk(
  "reminders/delete",
  async (reminderId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/reminders/${reminderId}`);
      return response.data.reminderId;
    } catch (error) {
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
        state.error = null;
      })
      .addCase(setReminder.fulfilled, (state, action) => {
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
        state.error = action.payload || "Failed to set reminder";
      })
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.reminders = state.reminders.filter(
          (reminder) => reminder._id !== action.payload
        );
      })
      .addCase(deleteReminder.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete reminder";
      });
  },
});
export const { clearReminderError } = remindersSlice.actions;
export default remindersSlice.reducer;
