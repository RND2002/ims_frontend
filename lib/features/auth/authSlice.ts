import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, UserProfile } from "@/lib/types/auth";
import { authApi } from "./authApi";

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  activePhone: null,
  authStatus: "idle",
};

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
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── sendOtp ───────────────────────────────────────────────
      .addMatcher(authApi.endpoints.sendOtp.matchPending, (state, action) => {
        state.loading = true;
        state.error = null;
        // Capture the phone from the request arg
        const phone = (action.meta.arg as any)?.originalArgs?.phone as string | undefined;
        if (phone) state.activePhone = phone;
      })
      .addMatcher(authApi.endpoints.sendOtp.matchFulfilled, (state) => {
        state.loading = false;
        state.authStatus = "otp_sent";
      })
      .addMatcher(authApi.endpoints.sendOtp.matchRejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.data?.detail ?? "Failed to send OTP";
      })

      // ── verifyOtp ─────────────────────────────────────────────
      .addMatcher(authApi.endpoints.verifyOtp.matchPending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher(authApi.endpoints.verifyOtp.matchFulfilled, (state, action) => {
        state.loading = false;
        state.authStatus = action.payload.status;
        if (action.payload.status === "login_success" && action.payload.access_token) {
          state.accessToken = action.payload.access_token;
        }
      })
      .addMatcher(authApi.endpoints.verifyOtp.matchRejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.data?.detail ?? "Failed to verify OTP";
      })

      // ── registerUser ──────────────────────────────────────────
      .addMatcher(authApi.endpoints.registerUser.matchPending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher(authApi.endpoints.registerUser.matchFulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.access_token;
        state.authStatus = "authenticated";
      })
      .addMatcher(authApi.endpoints.registerUser.matchRejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.data?.detail ?? "Failed to register";
      })

      // ── refreshSession ────────────────────────────────────────
      .addMatcher(authApi.endpoints.refreshSession.matchFulfilled, (state, action) => {
        state.accessToken = action.payload.access_token;
      })
      .addMatcher(authApi.endpoints.refreshSession.matchRejected, (state) => {
        state.accessToken = null;
        state.user = null;
        state.error = null;
        state.authStatus = "idle";
      })

      // ── logoutUser ────────────────────────────────────────────
      .addMatcher(authApi.endpoints.logoutUser.matchFulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.error = null;
        state.activePhone = null;
        state.authStatus = "idle";
        state.loading = false;
      })
      .addMatcher(authApi.endpoints.logoutUser.matchRejected, (state) => {
        // Force-clear auth even if the server call failed
        state.user = null;
        state.accessToken = null;
        state.authStatus = "idle";
        state.loading = false;
      });
  },
});

export const { setAccessToken, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
