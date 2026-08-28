"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchStores } from "@/lib/features/stores/storesSlice";
import { refreshSession, logoutUser } from "@/lib/features/auth/authSlice";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const stores = await dispatch(fetchStores()).unwrap();
        if (stores && stores.length > 0) {
          router.replace(`/store/${stores[0].id}`);
        } else {
          router.replace("/workspace-setup");
        }
      } catch (err) {
        console.error("Failed to load stores during redirect:", err);
        try {
          await dispatch(logoutUser()).unwrap();
        } catch (logoutErr) {
          console.error("Failed to clean up session:", logoutErr);
        }
        router.replace("/");
      }
    };

    checkAndRedirect();
  }, [dispatch, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F7F7FB] font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <p className="text-xs font-semibold text-text-secondary">Redirecting to your workspace...</p>
      </div>
    </div>
  );
}
