import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { RootState } from "./index";
import { refreshSession } from "@/lib/features/auth/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: "",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;
    const storeId = state.stores.activeStore?.id;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (storeId) {
      headers.set("X-Store-ID", storeId);
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to get a fresh token
    const refreshResult = await api.dispatch(refreshSession() as any);
    if (refreshResult.payload) {
      // Retry the initial query
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Session expired, redirect to log in
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Product", "Category", "Unit", "TaxRate", "Sale", "Party", "Member", "Expense"],
  keepUnusedDataFor: 300, // keep cached data in memory for 5 minutes when unused
  endpoints: () => ({}),
});
