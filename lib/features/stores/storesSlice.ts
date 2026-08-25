import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { createApiClient } from "@/lib/apiClient";

export interface Store {
  id: string;
  name: string;
  business_type: string;
  role: "Owner" | "Manager" | "Staff";
  plan_tier: "free" | "premium" | "enterprise";
  created_at: string;
}

interface StoresState {
  stores: Store[];
  activeStore: Store | null;
  loading: boolean;
  error: string | null;
}

const initialState: StoresState = {
  stores: [],
  activeStore: null,
  loading: false,
  error: null,
};

// Thunk to fetch all stores user is a member of
export const fetchStores = createAsyncThunk(
  "stores/fetchStores",
  async (_, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.get<Store[]>(API_ENDPOINTS.backend.stores.base);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error fetching stores");
    }
  }
);

// Thunk to create a new store
export const createNewStore = createAsyncThunk(
  "stores/createStore",
  async (
    payload: {
      name: string;
      business_type: string;
      address?: string;
      gstin?: string;
      currency?: string;
      timezone?: string;
      invoice_prefix?: string;
      low_stock_threshold_default?: number;
      plan_tier?: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.post<Store>(API_ENDPOINTS.backend.stores.base, {
        name: payload.name,
        business_type: payload.business_type,
        address: payload.address || "India",
        gstin: payload.gstin || "stringstringstr",
        currency: payload.currency || "INR",
        timezone: payload.timezone || "Asia/Kolkata",
        invoice_prefix: payload.invoice_prefix || "INV-",
        low_stock_threshold_default: payload.low_stock_threshold_default ?? 5,
        plan_tier: payload.plan_tier || "free",
      });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error creating store");
    }
  }
);

// Thunk to switch the active store in backend
export const switchStore = createAsyncThunk(
  "stores/switchStore",
  async (storeId: string, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      await client.post(API_ENDPOINTS.backend.stores.activeStore, { store_id: storeId });
      return storeId;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error switching store");
    }
  }
);

// Thunk to fetch active store
export const fetchActiveStore = createAsyncThunk(
  "stores/fetchActiveStore",
  async (_, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.get<Store>(API_ENDPOINTS.backend.stores.activeStore);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error fetching active store");
    }
  }
);

export const storesSlice = createSlice({
  name: "stores",
  initialState,
  reducers: {
    setActiveStoreClient: (state, action: PayloadAction<Store>) => {
      state.activeStore = action.payload;
    },
    clearStores: (state) => {
      state.stores = [];
      state.activeStore = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Stores
      .addCase(fetchStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.loading = false;
        state.stores = action.payload;
        // Default active store to first store if none is set
        if (!state.activeStore && action.payload.length > 0) {
          state.activeStore = action.payload[0];
        }
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Store
      .addCase(createNewStore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewStore.fulfilled, (state, action) => {
        state.loading = false;
        state.stores.push(action.payload);
        state.activeStore = action.payload;
      })
      .addCase(createNewStore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Switch Store
      .addCase(switchStore.pending, (state) => {
        state.loading = true;
      })
      .addCase(switchStore.fulfilled, (state, action) => {
        state.loading = false;
        const newActive = state.stores.find((s) => s.id === action.payload);
        if (newActive) {
          state.activeStore = newActive;
        }
      })
      .addCase(switchStore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Active Store
      .addCase(fetchActiveStore.fulfilled, (state, action) => {
        state.activeStore = action.payload;
      });
  },
});

export const { setActiveStoreClient, clearStores } = storesSlice.actions;
export default storesSlice.reducer;
