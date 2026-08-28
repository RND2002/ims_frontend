"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hooks";
import { useGetStoresQuery } from "@/lib/features/stores/storesApi";
import { useLogoutUserMutation } from "@/lib/features/auth/authApi";
import { apiSlice } from "@/lib/store/apiSlice";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logout] = useLogoutUserMutation();

  // Always fetch fresh stores on mount — prevents stale cache from a previous session
  // routing a new user to someone else's store
  const { data: stores, error, isLoading } = useGetStoresQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (isLoading) return;

    if (error) {
      console.error("Failed to load stores during redirect:", error);
      const errMsg = JSON.stringify(error).toLowerCase();
      const isAuthError =
        errMsg.includes("401") ||
        errMsg.includes("unauthorized") ||
        errMsg.includes("expired") ||
        errMsg.includes("token");

      if (isAuthError) {
        // Clear stale cache before logging out
        dispatch(apiSlice.util.resetApiState() as any);
        logout();
        router.replace("/");
      }
      return;
    }

    if (stores) {
      if (stores.length > 0) {
        router.replace(`/store/${stores[0].id}`);
      } else {
        router.replace("/workspace-setup");
      }
    }
  }, [stores, error, isLoading, router, dispatch]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F7F7FB] font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <p className="text-xs font-semibold text-text-secondary">Redirecting to your workspace...</p>
      </div>
    </div>
  );
}
