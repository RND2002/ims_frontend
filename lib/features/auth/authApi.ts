import { apiSlice } from "@/lib/store/apiSlice";
import { API_ENDPOINTS } from "@/app/api/endpoints";

export interface OtpSendRequest { phone: string; }
export interface OtpSendResponse { message: string; }

export interface OtpVerifyRequest { phone: string; otp: string; }
export interface OtpVerifyResponse {
  status: "login_success" | "requires_onboarding";
  access_token?: string;
}

export interface RegisterRequest {
  phone: string;
  name: string;
  email?: string | null;
}
export interface RegisterResponse { access_token: string; }

export interface RefreshResponse { access_token: string; token_type: string; }

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // POST /api/auth/otp/send
    sendOtp: builder.mutation<OtpSendResponse, OtpSendRequest>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.otpSend,
        method: "POST",
        body,
      }),
    }),

    // POST /api/auth/otp/verify
    verifyOtp: builder.mutation<OtpVerifyResponse, OtpVerifyRequest>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.otpVerify,
        method: "POST",
        body,
      }),
    }),

    // POST /api/auth/otp/register
    registerUser: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({
        url: API_ENDPOINTS.auth.otpRegister,
        method: "POST",
        body,
      }),
    }),

    // POST /api/auth/refresh  (called by baseQueryWithReauth — NOT the hook)
    refreshSession: builder.mutation<RefreshResponse, void>({
      query: () => ({
        url: API_ENDPOINTS.auth.refresh,
        method: "POST",
      }),
    }),

    // POST /api/auth/logout
    logoutUser: builder.mutation<void, void>({
      query: () => ({
        url: API_ENDPOINTS.auth.logout,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useRegisterUserMutation,
  useLogoutUserMutation,
} = authApi;

// These are used programmatically in baseQueryWithReauth / listenerMiddleware
export const { refreshSession, logoutUser } = authApi.endpoints;
