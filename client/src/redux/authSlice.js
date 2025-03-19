import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../utils/apiConfig";
import setAuthToken from "../utils/setAuthToken";
export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    if (localStorage.token) {
      setAuthToken(localStorage.token);
    }
    try {
      const res = await axios.get(`${API_URL}/auth`);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || error.message);
    }
  }
);
export const deleteAccount = createAsyncThunk(
  "auth/deleteAccount",
  async (_, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/users`);
      localStorage.removeItem("token");
      setAuthToken(false);
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || error.message);
    }
  }
);
export const register = createAsyncThunk(
  "auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/users`, formData);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setAuthToken(res.data.token);
      }
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.message);
    }
  }
);
export const login = createAsyncThunk(
  "auth/login",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, formData);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setAuthToken(res.data.token);
      }
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.message);
    }
  }
);
export const createAdmin = createAsyncThunk(
  "auth/createAdmin",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/users/admin`, formData);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.message);
    }
  }
);
const initialState = {
  token: localStorage.getItem("token"),
  isAuthenticated: null,
  loading: true,
  user: null,
  error: null,
};
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      localStorage.removeItem("token");
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loadUser.rejected, (state) => {
        localStorage.removeItem("token");
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        localStorage.removeItem("token");
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        localStorage.removeItem("token");
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAdmin.pending, (state) => {
        state.loading = true;
      })
      .addCase(createAdmin.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;
