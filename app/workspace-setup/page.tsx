"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { refreshSession, logoutUser } from "@/lib/features/auth/authSlice";
import { fetchStores } from "@/lib/features/stores/storesSlice";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CreateStoreDialog } from "@/components/dashboard/CreateStoreDialog";
import { InviteMemberDialog } from "@/components/dashboard/InviteMemberDialog";
import { Button } from "@/components/ui/button";
import trustIllustration from "@/app/assets/hisaab_trust_illustration.svg";
import { LogOut, Menu, X, User } from "lucide-react";

export default function WorkspaceSetupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const { stores, loading: storesLoading } = useAppSelector((state) => state.stores);
  const { t, language, setLanguage } = useLanguage();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Authenticate user and load workspaces
  // Load workspaces on mount
  useEffect(() => {
    let active = true;
    const initLayout = async () => {
      try {
        const loadedStores = await dispatch(fetchStores()).unwrap();
        if (loadedStores.length > 0) {
          if (active) router.push(`/store/${loadedStores[0].id}`);
          return;
        }
        if (active) setIsAuthChecking(false);
      } catch {
        if (active) router.push("/login");
      }
    };
    
    initLayout();
    return () => {
      active = false;
    };
  }, [dispatch, router]);

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
          <p className="text-xs font-semibold text-text-secondary">Verifying session...</p>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-[#E4E4F0] p-4 font-sans select-none">
      {/* Top Section: Brand Logo */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 px-2.5">
          <span className="font-serif text-2xl font-extrabold text-brand tracking-tight">
            Hisaab
          </span>
          <span className="bg-brand-light text-brand text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide">
            v2
          </span>
        </div>

        {/* Quick Add Store button */}
        <Button
          onClick={() => setIsCreateStoreOpen(true)}
          variant="outline"
          className="w-full py-5 text-xs font-bold border-dashed border-[#C7C7E0] hover:border-brand hover:text-brand justify-center cursor-pointer mt-1"
        >
          {t("sidebar.addStore")}
        </Button>
      </div>

      <div className="flex-1" />

      {/* Bottom Section: Language Toggle + User Info and Logout */}
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
      {/* Desktop Sidebar */}
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

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-[#151328]/35 backdrop-blur-sm"
            />
            <aside className="relative w-64 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Main Content: Add store banner */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto select-none p-4">
            <h2 className="text-2xl font-extrabold text-[#151328] tracking-tight">
              {t("dashboard.welcome")}
            </h2>
            <p className="text-xs text-[#65637D] mt-2 leading-relaxed font-semibold max-w-[480px]">
              {t("dashboard.createStorePrompt")}
            </p>
            
            {/* Trust Illustration */}
            <img
              src={trustIllustration.src}
              alt="Hisaab Trust Illustration"
              className="w-full max-w-[500px] h-auto my-8 select-none pointer-events-none"
            />

            <Button
              onClick={() => setIsCreateStoreOpen(true)}
              variant="cta"
              size="xl"
              className="cursor-pointer max-w-[320px] w-full"
            >
              {t("dashboard.createStore")}
            </Button>
          </div>
        </main>
      </div>

      {/* Create Store Dialog */}
      <CreateStoreDialog
        isOpen={isCreateStoreOpen}
        onClose={() => setIsCreateStoreOpen(false)}
        onSuccess={() => {
          setIsCreateStoreOpen(false);
          setIsInviteOpen(true);
        }}
      />
      {/* Invite Dialog */}
      <InviteMemberDialog
        isOpen={isInviteOpen}
        onClose={() => {
          setIsInviteOpen(false);
          // Refresh page / redirect after done
          dispatch(fetchStores()).then((res: any) => {
            if (res.payload && res.payload.length > 0) {
              router.push(`/${res.payload[0].id}`);
            }
          });
        }}
        onSkip={() => {
          setIsInviteOpen(false);
          dispatch(fetchStores()).then((res: any) => {
            if (res.payload && res.payload.length > 0) {
              router.push(`/${res.payload[0].id}`);
            }
          });
        }}
      />
    </div>
  );
}
