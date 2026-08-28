import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createApiClient } from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { RootState } from "@/lib/store";
import { Sale, Party } from "@/lib/types/sales";
import { PaginatedResponse } from "@/lib/types/catalog";

interface SalesState {
  sales: Sale[];
  total: number;
  limit: number;
  offset: number;
  customers: Party[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: SalesState = {
  sales: [],
  total: 0,
  limit: 20,
  offset: 0,
  customers: [],
  loading: false,
  saving: false,
  error: null,
};

// Normalize backend string values (e.g. decimal grand_total, amount_paid) into numbers
const parseSaleNumbers = (sale: any): Sale => {
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

// Thunk to fetch sales transactions list (paginated)
export const fetchSales = createAsyncThunk(
  "sales/fetchSales",
  async (
    params: { limit?: number; offset?: number; search?: string; status?: string } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const queryParams = new URLSearchParams();
      if (params.limit !== undefined) queryParams.append("limit", String(params.limit));
      if (params.offset !== undefined) queryParams.append("offset", String(params.offset));
      if (params.search) queryParams.append("search", params.search);
      if (params.status) queryParams.append("status", params.status);

      const url = `${API_ENDPOINTS.backend.transactions.sales}?${queryParams.toString()}`;
      const data = await client.get<PaginatedResponse<any>>(url);
      return {
        data: {
          items: (data.items || []).map(parseSaleNumbers),
          total: data.total || 0,
        },
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch sales transactions");
    }
  }
);

// Thunk to create a sales transaction (checkout)
export const createSale = createAsyncThunk(
  "sales/createSale",
  async (
    payload: {
      party_id?: string | null;
      subtotal: number;
      tax_total: number;
      grand_total: number;
      amount_paid: number;
      items: Array<{ product_id: string; quantity: number; unit_price: number }>;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.post<any>(API_ENDPOINTS.backend.transactions.sales, payload);
      return parseSaleNumbers(data);
    } catch (err: any) {
      return rejectWithValue(err.message || "Checkout failed");
    }
  }
);

// Thunk to fetch store customers (parties with party_type='customer')
export const fetchCustomers = createAsyncThunk(
  "sales/fetchCustomers",
  async (_, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const queryParams = new URLSearchParams();
      queryParams.append("party_type", "customer");
      
      const url = `${API_ENDPOINTS.backend.parties.base}?${queryParams.toString()}`;
      const data = await client.get<any>(url);
      
      // Handle potential pagination wrapper from backend
      if (data && typeof data === "object" && "items" in data) {
        return data.items || [];
      }
      return Array.isArray(data) ? data : [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch customers");
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as RootState;
      if (state.sales.customers.length > 0) {
        return false;
      }
    },
  }
);

// Thunk to create a new customer inline (Party)
export const createCustomer = createAsyncThunk(
  "sales/createCustomer",
  async (
    payload: { name: string; phone: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.post<Party>(API_ENDPOINTS.backend.parties.base, {
        name: payload.name,
        phone: payload.phone,
        party_type: "customer",
      });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create customer");
    }
  }
);

export const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    clearSalesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Sales
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.loading = false;
        state.sales = action.payload.data.items;
        state.total = action.payload.data.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Sale (Checkout)
      .addCase(createSale.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createSale.fulfilled, (state, action) => {
        state.saving = false;
        state.sales.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createSale.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      // Fetch Customers
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.customers = action.payload;
      })
      // Create Customer
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
      });
  },
});

export const { clearSalesError } = salesSlice.actions;
export default salesSlice.reducer;
