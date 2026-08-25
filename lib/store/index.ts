import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import storesReducer from "../features/stores/storesSlice";
import catalogReducer from "../features/catalog/catalogSlice";
import salesReducer from "../features/sales/salesSlice";
import membersReducer from "../features/members/membersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    stores: storesReducer,
    catalog: catalogReducer,
    sales: salesReducer,
    members: membersReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
