import { apiSlice } from "@/lib/store/apiSlice";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { Sale, Party } from "@/lib/types/sales";
import { PaginatedResponse } from "@/lib/types/catalog";

export const parseSaleNumbers = (sale: any): Sale => {
  if (!sale) return sale;
  return {
    ...sale,
    subtotal: sale.subtotal ? Number(sale.subtotal) : 0,
    tax_total: sale.tax_total ? Number(sale.tax_total) : 0,
    discount: sale.discount ? Number(sale.discount) : 0,
    grand_total: sale.grand_total ? Number(sale.grand_total) : 0,
    amount_paid: sale.amount_paid ? Number(sale.amount_paid) : 0,
    items: Array.isArray(sale.items)
      ? sale.items.map((item: any) => ({
          ...item,
          quantity: item.quantity ? Number(item.quantity) : 0,
          unit_price: item.unit_price ? Number(item.unit_price) : 0,
          tax_rate: item.tax_rate ? Number(item.tax_rate) : undefined,
          line_total: item.line_total ? Number(item.line_total) : 0,
        }))
      : [],
  };
};

export const salesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query<
      PaginatedResponse<Sale>,
      { limit?: number; offset?: number; search?: string; status?: string }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.limit !== undefined) queryParams.append("limit", String(params.limit));
        if (params.offset !== undefined) queryParams.append("offset", String(params.offset));
        if (params.search) queryParams.append("search", params.search);
        if (params.status) queryParams.append("status", params.status);
        return `${API_ENDPOINTS.backend.transactions.sales}?${queryParams.toString()}`;
      },
      transformResponse: (response: PaginatedResponse<Sale>) => ({
        ...response,
        items: (response.items || []).map(parseSaleNumbers),
      }),
      providesTags: ["Sale"],
    }),
    getCustomers: builder.query<Party[], void>({
      query: () => {
        const queryParams = new URLSearchParams();
        queryParams.append("party_type", "customer");
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
    createSale: builder.mutation<
      Sale,
      {
        party_id?: string | null;
        subtotal: number;
        tax_total: number;
        discount?: number;
        grand_total: number;
        amount_paid: number;
        items: {
          product_id: string;
          quantity: number;
          unit_price: number;
          tax_rate_id?: string | null;
        }[];
      }
    >({
      query: (payload) => ({
        url: API_ENDPOINTS.backend.transactions.sales,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: Sale) => parseSaleNumbers(response),
      invalidatesTags: ["Sale", "Party"],
    }),
    createCustomer: builder.mutation<Party, { name: string; phone: string }>({
      query: (payload) => ({
        url: API_ENDPOINTS.backend.parties.base,
        method: "POST",
        body: {
          ...payload,
          party_type: "customer",
        },
      }),
      invalidatesTags: ["Party"],
    }),
  }),
});

export const {
  useGetSalesQuery,
  useGetCustomersQuery,
  useCreateSaleMutation,
  useCreateCustomerMutation,
} = salesApi;
