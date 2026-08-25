"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const storeId = params.storeId as string;
  const { t } = useLanguage();

  const settingsMenu = [
    {
      name: t("settings.menu.storeDetails") || "Store Details",
      href: `/store/${storeId}/settings`,
    },
    {
      name: t("settings.menu.members") || "Members & Roles",
      href: `/store/${storeId}/settings/members`,
    },
    {
      name: t("settings.menu.categories") || "Categories & Units",
      href: `/store/${storeId}/settings#categories`,
    },
    {
      name: t("settings.menu.taxRates") || "Tax Rates",
      href: `/store/${storeId}/settings#taxes`,
    },
    {
      name: t("settings.menu.billing") || "Billing & Plan",
      href: `/store/${storeId}/settings#billing`,
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row bg-white border border-[#E4E4F0] rounded-xl overflow-hidden min-h-[75vh] font-sans">
      
      {/* Secondary Settings Sidebar Navigation */}
      <aside className="w-full lg:w-[240px] border-r border-[#E4E4F0] bg-white shrink-0 p-4 flex flex-col gap-1 select-none">
        <div className="px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Settings Menu
        </div>
        
        {settingsMenu.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center h-10 px-3.5 rounded-lg text-xs font-bold transition-all border-l-3 border-transparent cursor-pointer",
                isActive
                  ? "bg-brand-light text-brand border-brand font-bold"
                  : "text-[#65637D] hover:bg-[#F7F7FB] hover:text-[#151328] font-medium"
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </aside>

      {/* Main Settings Panel Workspace */}
      <main className="flex-1 p-6 lg:p-8 bg-white min-w-0">
        {children}
      </main>

    </div>
  );
}
