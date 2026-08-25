import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, UserProfile } from "@/lib/types/auth";
import { API_ENDPOINTS } from "@/app/api/endpoints";

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
};

// Async thunk for Signup proxy
export const signupUser = createAsyncThunk(
  "auth/signup",
  async (payload: Record<string, any>, { rejectWithValue }) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.signup, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.detail || "Signup failed");
      }
      return data as UserProfile;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error during signup");
    }
  }
);

// Async thunk for Login proxy
export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload: Record<string, any>, { rejectWithValue }) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.detail || "Login failed");
      }
      return data as { access_token: string; token_type: string };
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error during login");
    }
  }
);

// Async thunk for Refresh proxy
export const refreshSession = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.refresh, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.detail || "Session expired");
      }
      return data as { access_token: string; token_type: string };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to refresh session");
    }
  }
);

// Async thunk for Logout proxy
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.logout, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.detail || "Logout failed");
      }
      return null;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to log out");
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
    },
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.access_token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Refresh
      .addCase(refreshSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.access_token;
      })
      .addCase(refreshSession.rejected, (state, action) => {
        state.loading = false;
        state.accessToken = null;
        state.user = null;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.error = null;
        state.loading = false;
      });
  },
});

export const { setAccessToken, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
