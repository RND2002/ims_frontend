import { apiSlice } from "@/lib/store/apiSlice";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { PaginatedResponse } from "@/lib/types/catalog";

export interface Expense {
  id: string;
  store_id: string;
  category: string;
  amount: number;
  description?: string;
  expense_date: string;
  created_at: string;
}

export const expensesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query<
      PaginatedResponse<Expense>,
      { category?: string; limit?: number; offset?: number }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.category) queryParams.append("category", params.category);
        if (params.limit !== undefined) queryParams.append("limit", String(params.limit));
        if (params.offset !== undefined) queryParams.append("offset", String(params.offset));
        return `${API_ENDPOINTS.backend.expenses.base}?${queryParams.toString()}`;
      },
      transformResponse: (response: PaginatedResponse<Expense>) => ({
        ...response,
        items: (response.items || []).map((e: any) => ({
          ...e,
          amount: e.amount ? Number(e.amount) : 0,
        })),
      }),
      providesTags: ["Expense"],
    }),
    createExpense: builder.mutation<
      Expense,
      {
        category: string;
        amount: number;
        description?: string;
        expense_date: string;
      }
    >({
      query: (payload) => ({
        url: API_ENDPOINTS.backend.expenses.base,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Expense"],
    }),
    deleteExpense: builder.mutation<void, string>({
      query: (expenseId) => ({
        url: API_ENDPOINTS.backend.expenses.expenseById(expenseId),
        method: "DELETE",
      }),
      invalidatesTags: ["Expense"],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
} = expensesApi;
