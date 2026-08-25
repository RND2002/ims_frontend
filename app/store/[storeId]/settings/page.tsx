"use client";

import React, { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Store } from "lucide-react";

export default function StoreDetailsSettingsPage() {
  const { activeStore } = useAppSelector((state) => state.stores);
  const { t } = useLanguage();

  if (!activeStore) return null;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="border-b pb-4 mb-6">
        <h2 className="text-base font-bold text-[#151328]">{t("settings.menu.storeDetails") || "Store Details"}</h2>
        <p className="text-xs font-semibold text-[#65637D] mt-0.5">
          View your store workspace configurations and profile metrics.
        </p>
      </div>

      <div className="max-w-xl space-y-5">
        
        {/* Logo/Icon section */}
        <div className="flex items-center gap-4 p-4.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="h-12 w-12 rounded-lg bg-indigo-50 border border-brand-light text-brand flex items-center justify-center shrink-0">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#151328]">{activeStore.name}</h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-brand px-2 py-0.5 rounded-full border border-brand-light mt-1 inline-block">
              {activeStore.plan_tier || "Free"} Workspace
            </span>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Store ID</label>
            <input
              type="text"
              readOnly
              value={activeStore.id}
              className="w-full h-10 px-3 bg-slate-50 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] font-mono outline-none cursor-default font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Store Name</label>
            <input
              type="text"
              readOnly
              value={activeStore.name}
              className="w-full h-10 px-3 bg-slate-50 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none cursor-default font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Business Type</label>
            <input
              type="text"
              readOnly
              value={activeStore.business_type}
              className="w-full h-10 px-3 bg-slate-50 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none cursor-default font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Your Access Role</label>
            <div className="h-10 px-3 flex items-center bg-indigo-50 border border-brand-light rounded-lg text-sm text-brand font-bold capitalize">
              {activeStore.role}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1.5 leading-normal">
              Your permissions on this store are defined by your role. Reach out to the store owner to override specific actions.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
