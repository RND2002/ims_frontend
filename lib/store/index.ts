import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import storesReducer from "../features/stores/storesSlice";
import catalogReducer from "../features/catalog/catalogSlice";
import salesReducer from "../features/sales/salesSlice";
import membersReducer from "../features/members/membersSlice";
import { apiSlice } from "./apiSlice";
import { listenerMiddleware } from "./middleware";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    stores: storesReducer,
    catalog: catalogReducer,
    sales: salesReducer,
    members: membersReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware) // fires before RTK Query middleware
      .concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
