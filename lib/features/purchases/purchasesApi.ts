import { apiSlice } from "@/lib/store/apiSlice";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { ImportBatch } from "@/lib/types/imports";
import { PaginatedResponse } from "@/lib/types/catalog";
import { Party } from "@/lib/types/sales";

export const purchasesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getImportBatches: builder.query<
      PaginatedResponse<ImportBatch>,
      { limit?: number; offset?: number }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.limit !== undefined) queryParams.append("limit", String(params.limit));
        if (params.offset !== undefined) queryParams.append("offset", String(params.offset));
        return `${API_ENDPOINTS.backend.imports.batches}?${queryParams.toString()}`;
      },
      providesTags: ["ImportBatch"],
    }),
    getSuppliers: builder.query<Party[], void>({
      query: () => {
        const queryParams = new URLSearchParams();
        queryParams.append("party_type", "supplier");
        return `${API_ENDPOINTS.backend.parties.base}?${queryParams.toString()}`;
      },
      transformResponse: (response: any) => {
        if (response && typeof response === "object" && "items" in response) {
          return response.items || [];
        }
        return Array.isArray(response) ? response : [];
      },
      providesTags: ["Party"],
    }),
    createManualPurchase: builder.mutation<
      any,
      {
        party_id: string;
        bill_no: string;
        grand_total: number;
        amount_paid: number;
        items: {
          product_id: string;
          quantity: number;
          unit_cost: number;
          batch_no?: string;
          expiry_date?: string | null;
        }[];
      }
    >({
      query: (payload) => ({
        url: API_ENDPOINTS.backend.transactions.purchases,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Product", "Party", "ImportBatch"],
    }),
    getImportBatchById: builder.query<ImportBatch, string>({
      query: (batchId) => API_ENDPOINTS.backend.imports.batchById(batchId),
    }),
  }),
});

export const {
  useGetImportBatchesQuery,
  useGetSuppliersQuery,
  useCreateManualPurchaseMutation,
  useGetImportBatchByIdQuery,
} = purchasesApi;
