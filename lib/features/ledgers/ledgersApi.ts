import { apiSlice } from "@/lib/store/apiSlice";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { Party, LedgerStatement } from "@/lib/types/sales";
import { PaginatedResponse } from "@/lib/types/catalog";

export const ledgersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getParties: builder.query<
      PaginatedResponse<Party>,
      { partyType: "customer" | "supplier"; limit?: number; offset?: number; search?: string }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        queryParams.append("party_type", params.partyType);
        if (params.limit !== undefined) queryParams.append("limit", String(params.limit));
        if (params.offset !== undefined) queryParams.append("offset", String(params.offset));
        if (params.search) queryParams.append("search", params.search);
        return `${API_ENDPOINTS.backend.parties.base}?${queryParams.toString()}`;
      },
      transformResponse: (response: PaginatedResponse<Party>) => ({
        ...response,
        items: (response.items || []).map((p: any) => ({
          ...p,
          opening_balance: p.opening_balance ? Number(p.opening_balance) : 0,
          current_balance: p.current_balance ? Number(p.current_balance) : 0,
        })),
      }),
      providesTags: ["Party"],
    }),
    getLedgerStatement: builder.query<LedgerStatement, string>({
      query: (partyId) => API_ENDPOINTS.backend.ledger.statement(partyId),
      transformResponse: (response: any) => ({
        ...response,
        current_balance: response.current_balance ? Number(response.current_balance) : 0,
        entries: Array.isArray(response.entries)
          ? response.entries.map((e: any) => ({
              ...e,
              amount: e.amount ? Number(e.amount) : 0,
              balance_after: e.balance_after ? Number(e.balance_after) : 0,
            }))
          : [],
      }),
      providesTags: ["Party"],
    }),
    createParty: builder.mutation<
      Party,
      { name: string; phone: string; party_type: "customer" | "supplier"; address?: string }
    >({
      query: (payload) => ({
        url: API_ENDPOINTS.backend.parties.base,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Party"],
    }),
    recordPayment: builder.mutation<
      void,
      {
        party_id: string;
        amount: number;
        entry_type: "credit" | "debit";
        payment_mode: "cash" | "upi" | "card" | "bank_transfer";
        direction: "received" | "paid";
        note?: string;
      }
    >({
      query: (payload) => ({
        url: API_ENDPOINTS.backend.ledger.payments,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Party"],
    }),
  }),
});

export const {
  useGetPartiesQuery,
  useGetLedgerStatementQuery,
  useLazyGetLedgerStatementQuery,
  useCreatePartyMutation,
  useRecordPaymentMutation,
} = ledgersApi;
