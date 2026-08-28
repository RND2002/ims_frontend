import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Store {
  id: string;
  name: string;
  business_type: string;
  role: "Owner" | "Manager" | "Staff";
  plan_tier: "free" | "premium" | "enterprise";
  created_at: string;
}

interface StoresState {
  activeStore: Store | null;
}

const initialState: StoresState = {
  activeStore: null,
};

export const storesSlice = createSlice({
  name: "stores",
  initialState,
  reducers: {
    setActiveStoreClient: (state, action: PayloadAction<Store | null>) => {
      state.activeStore = action.payload;
    },
    clearStores: (state) => {
      state.activeStore = null;
    },
  },
});

export const { setActiveStoreClient, clearStores } = storesSlice.actions;
export default storesSlice.reducer;
