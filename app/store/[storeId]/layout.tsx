"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { logoutUser } from "@/lib/features/auth/authSlice";
import { setActiveStoreClient } from "@/lib/features/stores/storesSlice";
import { useGetStoresQuery } from "@/lib/features/stores/storesApi";
import { fetchMembers } from "@/lib/features/members/membersSlice";
import { usePermission } from "@/lib/hooks/usePermission";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { WorkspaceSwitcher } from "@/components/dashboard/WorkspaceSwitcher";
import { CreateStoreDialog } from "@/components/dashboard/CreateStoreDialog";
import { InviteMemberDialog } from "@/components/dashboard/InviteMemberDialog";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function StoreWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const storeId = params.storeId as string;
  
  const dispatch = useAppDispatch();
  const { accessToken, user } = useAppSelector((state) => state.auth);
  
  // Use RTK Query to load stores list
  const { data: stores = [], isLoading: storesLoading, error: storesError } = useGetStoresQuery();
  const { activeStore } = useAppSelector((state) => state.stores);

  const { members } = useAppSelector((state) => state.members);
  const { t, language, setLanguage } = useLanguage();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Load stores on mount / check auth status
  useEffect(() => {
    if (storesLoading) return;

    if (storesError) {
      const errMsg = JSON.stringify(storesError).toLowerCase();
      const isAuthError =
        errMsg.includes("401") ||
        errMsg.includes("unauthorized") ||
        errMsg.includes("expired") ||
        errMsg.includes("token");

      if (isAuthError) {
        dispatch(logoutUser());
        router.push("/");
      }
      return;
    }

    setIsAuthChecking(false);
  }, [storesLoading, storesError, router, dispatch]);

  // Sync route storeId param with activeStore state
  useEffect(() => {
    if (storesLoading || !storeId || stores.length === 0) return;

    const matchingStore = stores.find((s) => s.id === storeId);
    if (!matchingStore) {
      // If store ID is invalid for this user, redirect to default dashboard
      router.push("/dashboard");
      return;
    }

    if (!activeStore || activeStore.id !== storeId) {
      dispatch(setActiveStoreClient(matchingStore));
    }
  }, [storeId, stores, storesLoading, activeStore, dispatch, router]);

  // Load members on mount or storeId change
  useEffect(() => {
    if (storeId && accessToken) {
      dispatch(fetchMembers(storeId));
    }
  }, [storeId, accessToken, dispatch]);

  const { hasPermission } = usePermission();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (isAuthChecking || storesLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F7F7FB] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-xs font-semibold text-text-secondary">Verifying workspace...</p>
        </div>
      </div>
    );
  }

  // Compute current user's resolved role
  let resolvedRole = activeStore?.role || "null";
  let currentUserId = user?.id;
  let currentUserPhone = user?.phone;
  if ((!currentUserId || !currentUserPhone) && accessToken) {
    const decoded = decodeJwt(accessToken);
    if (decoded) {
      const sub = decoded.sub || decoded.user_id || decoded.id;
      if (sub) {
        if (sub.includes("@") || sub.length > 15) {
          currentUserId = sub;
        } else {
          currentUserPhone = sub.replace(/\D/g, "");
        }
      }
    }
  }
  if (members.length > 0) {
    const currentMember = members.find((m) => {
      if (currentUserId && m.user_id === currentUserId) return true;
      if (currentUserPhone) {
        const mPhone = m.user.phone.replace(/\D/g, "");
        const targetPhone = currentUserPhone.replace(/\D/g, "");
        return mPhone.endsWith(targetPhone) || targetPhone.endsWith(mPhone);
      }
      return false;
    });
    if (currentMember) {
      resolvedRole = currentMember.role;
    }
  }

  const menuItems = [
    { name: t("sidebar.nav.dashboard"), href: `/store/${storeId}`, icon: LayoutDashboard, show: true },
    { name: t("sidebar.nav.catalog"), href: `/store/${storeId}/catalog`, icon: Package, show: hasPermission("catalog:view") },
    { name: t("sidebar.nav.sales"), href: `/store/${storeId}/sales`, icon: ShoppingCart, show: hasPermission("sales:view") },
    { name: t("sidebar.nav.purchases") || "Purchases", href: `/store/${storeId}/purchases`, icon: Receipt, show: hasPermission("catalog:view") },
    { name: t("sidebar.nav.expenses"), href: `/store/${storeId}/expenses`, icon: FileText, show: hasPermission("expenses:view") },
    { name: t("sidebar.nav.ledgers"), href: `/store/${storeId}/ledgers`, icon: BookOpen, show: hasPermission("ledgers:view") },
    { name: t("sidebar.nav.settings"), href: `/store/${storeId}/settings`, icon: Settings, show: hasPermission("members:view") },
  ].filter((item) => item.show);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-[#E4E4F0] p-4 font-sans select-none">
      {/* Top Section: Brand Logo & Switcher */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 px-2.5">
          <span className="font-serif text-2xl font-extrabold text-brand tracking-tight">
            Hisaab
          </span>
        </div>

        {/* Workspace Switcher */}
        <WorkspaceSwitcher onCreateStoreClick={() => setIsCreateStoreOpen(true)} />

        {/* Quick Add Store button */}
        <Button
          onClick={() => setIsCreateStoreOpen(true)}
          variant="outline"
          className="w-full py-5 text-xs font-bold border-dashed border-[#C7C7E0] hover:border-brand hover:text-brand justify-center cursor-pointer mt-1"
        >
          {t("sidebar.addStore")}
        </Button>
      </div>

      {/* Middle Section: Navigation Menu Links */}
      {stores.length > 0 ? (
        <nav className="flex-1 mt-6 flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                  isActive
                    ? "bg-brand-light text-brand font-bold"
                    : "text-[#65637D] hover:bg-[#F7F7FB] font-medium"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-brand" : "text-[#65637D]"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      ) : (
        <div className="flex-1" />
      )}

      {/* Bottom Section: Language Toggle + User Info + Logout */}
      <div className="border-t border-[#E4E4F0] pt-4 mt-auto flex flex-col gap-3">
        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === "en" ? "hi" : "en")}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-[#E4E4F0] hover:border-brand hover:bg-brand-light/30 transition-all cursor-pointer outline-none group"
        >
          <span className="text-[11px] font-bold text-[#65637D] group-hover:text-brand uppercase tracking-wider">
            {t("lang.current")}
          </span>
          <span className="text-[11px] font-bold text-brand">
            {t("lang.toggle")}
          </span>
        </button>

        <div className="flex items-center gap-3 px-2">
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-[#EEF2FF] border border-[#C7C7E0] text-brand shrink-0">
            <User className="h-4.5 w-4.5 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#151328] truncate">{user?.name || t("sidebar.storeOwner")}</p>
            <p className="text-[10px] font-medium text-[#65637D] truncate">{user?.phone || ""}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] text-danger-text hover:bg-danger-bg font-medium transition-colors cursor-pointer outline-none text-left"
        >
          <LogOut className="h-4.5 w-4.5 text-danger-text" />
          {t("sidebar.logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F7FB]">
      {/* Desktop Sidebar (lg screens) */}
      <aside className="hidden lg:block w-64 h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between bg-white border-b border-[#E4E4F0] px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl font-extrabold text-brand tracking-tight">
              Hisaab
            </span>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg border border-[#E4E4F0] text-[#151328] hover:bg-[#F7F7FB] transition-colors cursor-pointer outline-none"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Sidebar Overlay menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            {/* Overlay backdrop */}
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-[#151328]/35 backdrop-blur-sm"
            />
            {/* Sidebar drawer content */}
            <aside className="relative w-64 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Inner Scrollable Workspace Container */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Create Store Modal Dialog */}
      <CreateStoreDialog
        isOpen={isCreateStoreOpen}
        onClose={() => setIsCreateStoreOpen(false)}
        onSuccess={() => {
          setIsCreateStoreOpen(false);
          setIsInviteOpen(true);
        }}
      />
      {/* Invite Member Dialog — shown after any store creation */}
      <InviteMemberDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSkip={() => setIsInviteOpen(false)}
      />
    </div>
  );
}
