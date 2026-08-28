import { apiSlice } from "@/lib/store/apiSlice";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { Store } from "@/lib/features/stores/storesSlice";

export const storesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStores: builder.query<Store[], void>({
      query: () => API_ENDPOINTS.backend.stores.base,
      providesTags: ["Store"],
    }),
    createStore: builder.mutation<
      Store,
      {
        name: string;
        business_type: string;
        address?: string;
        gstin?: string;
        currency?: string;
        timezone?: string;
        invoice_prefix?: string;
        low_stock_threshold_default?: number;
        plan_tier?: string;
      }
    >({
      query: (payload) => ({
        url: API_ENDPOINTS.backend.stores.base,
        method: "POST",
        body: {
          name: payload.name,
          business_type: payload.business_type,
          address: payload.address || "India",
          gstin: payload.gstin || "stringstringstr",
          currency: payload.currency || "INR",
          timezone: payload.timezone || "Asia/Kolkata",
          invoice_prefix: payload.invoice_prefix || "INV-",
          low_stock_threshold_default: payload.low_stock_threshold_default ?? 5,
          plan_tier: payload.plan_tier || "free",
        },
      }),
      invalidatesTags: ["Store"],
    }),
  }),
});

export const {
  useGetStoresQuery,
  useCreateStoreMutation,
} = storesApi;
