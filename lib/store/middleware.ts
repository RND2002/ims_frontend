import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import { authApi } from "@/lib/features/auth/authApi";

/**
 * Global side-effect middleware.
 *
 * Whenever logout succeeds OR fails (server unreachable), wipe the
 * entire RTK Query cache so the next user always gets fresh data.
 */
export const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  matcher: isAnyOf(
    authApi.endpoints.logoutUser.matchFulfilled,
    authApi.endpoints.logoutUser.matchRejected
  ),
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(apiSlice.util.resetApiState());
  },
});
