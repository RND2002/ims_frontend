import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { RootState } from "./index";

const baseQuery = fetchBaseQuery({
  baseUrl: "",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;
    const storeId = state.stores.activeStore?.id;

    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (storeId) headers.set("X-Store-ID", storeId);
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  const url = typeof args === "string" ? args : args?.url;
  const isRefreshRequest = typeof url === "string" && (url.includes("/refresh") || url.includes("refresh"));

  if (result.error && result.error.status === 401 && !isRefreshRequest) {
    // Dynamically import authApi at runtime to break the module-level circular dependency
    const { authApi } = await import("@/lib/features/auth/authApi");
    
    const refreshResult = await api.dispatch(
      authApi.endpoints.refreshSession.initiate()
    );

    if ("data" in refreshResult && refreshResult.data) {
      // Retry the original query with the new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed — perform a hard logout and redirect to landing
      await api.dispatch(authApi.endpoints.logoutUser.initiate());
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
  tagTypes: [
    "Product", "Category", "Unit", "TaxRate",
    "Sale", "Party", "Member", "Expense", "Store", "ImportBatch",
  ],
  keepUnusedDataFor: 60,
  endpoints: () => ({}),
});
