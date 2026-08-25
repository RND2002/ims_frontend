import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, UserProfile } from "@/lib/types/auth";
import { API_ENDPOINTS } from "@/app/api/endpoints";

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  activePhone: null,
  authStatus: "idle",
};

// Async thunks for OTP-based Authentication
export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (phone: string, { rejectWithValue }) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.otpSend, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.detail || "Failed to send OTP");
      }
      return { phone, data };
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error while sending OTP");
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (payload: { phone: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.otpVerify, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.detail || "Failed to verify OTP");
      }
      return data as { status: "login_success" | "requires_onboarding"; access_token?: string };
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error while verifying OTP");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (
    payload: { phone: string; name: string; email?: string | null },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.otpRegister, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.detail || "Failed to register user");
      }
      return data as { access_token: string };
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error while registering user");
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
      state.activePhone = null;
      state.authStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP
      .addCase(sendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.activePhone = action.payload.phone;
        state.authStatus = "otp_sent";
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.authStatus = action.payload.status;
        if (action.payload.status === "login_success" && action.payload.access_token) {
          state.accessToken = action.payload.access_token;
        }
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.access_token;
        state.authStatus = "authenticated";
      })
      .addCase(registerUser.rejected, (state, action) => {
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
        state.activePhone = null;
        state.authStatus = "idle";
        state.loading = false;
      });
  },
});

export const { setAccessToken, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
