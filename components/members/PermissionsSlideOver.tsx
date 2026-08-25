"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Membership, StoreRole } from "@/lib/types/members";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Replicate defaults for audit labels
const ROLE_DEFAULTS: Record<StoreRole, string[]> = {
  owner: [
    "catalog:view", "catalog:create", "catalog:update", "catalog:delete",
    "stock:view", "stock:adjust",
    "sales:view", "sales:create", "sales:delete",
    "ledgers:view", "ledgers:create", "ledgers:delete",
    "expenses:view", "expenses:create", "expenses:delete",
    "members:view", "members:invite", "members:role_update", "members:remove",
    "dashboard:view"
  ],
  manager: [
    "catalog:view", "catalog:create", "catalog:update", "catalog:delete",
    "stock:view", "stock:adjust",
    "sales:view", "sales:create", "sales:delete",
    "ledgers:view", "ledgers:create", "ledgers:delete",
    "expenses:view", "expenses:create", "expenses:delete",
    "members:view", "members:invite", "members:role_update", "members:remove",
    "dashboard:view"
  ],
  staff: [
    "catalog:view", "catalog:create", "catalog:update",
    "stock:view", "stock:adjust",
    "sales:view", "sales:create",
    "ledgers:view", "ledgers:create",
    "expenses:view", "expenses:create",
    "dashboard:view"
  ],
  viewer: [
    "catalog:view",
    "stock:view",
    "sales:view",
    "ledgers:view",
    "expenses:view",
    "dashboard:view"
  ],
  accountant: [
    "ledgers:view",
    "expenses:view",
    "dashboard:view"
  ]
};

// Define UI grouped actions
const PERMISSION_GROUPS = [
  {
    key: "catalog",
    label: "Catalog",
    actions: ["catalog:view", "catalog:create", "catalog:update", "catalog:delete"],
  },
  {
    key: "stock",
    label: "Stock",
    actions: ["stock:view", "stock:adjust"],
  },
  {
    key: "sales",
    label: "Sales & Purchases",
    actions: ["sales:view", "sales:create", "sales:delete"],
  },
  {
    key: "ledgers",
    label: "Ledgers & Payments",
    actions: ["ledgers:view", "ledgers:create", "ledgers:delete"],
  },
  {
    key: "expenses",
    label: "Expenses",
    actions: ["expenses:view", "expenses:create", "expenses:delete"],
  },
  {
    key: "members",
    label: "Members",
    actions: ["members:view", "members:invite", "members:role_update", "members:remove"],
  },
];

interface PermissionsSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  member: Membership | null;
  onSave: (userId: string, overrides: Record<string, boolean>) => Promise<void>;
  saving: boolean;
}

export function PermissionsSlideOver({ isOpen, onClose, member, onSave, saving }: PermissionsSlideOverProps) {
  const { t } = useLanguage();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  // Sync internal override state when member changes
  useEffect(() => {
    if (member) {
      setOverrides(member.permissions?.overrides || {});
    } else {
      setOverrides({});
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const role = member.role.toLowerCase() as StoreRole;
  const initial = member.user.name.trim().charAt(0).toUpperCase() || "M";

  // Check current effective status of an action
  const isAllowed = (action: string): boolean => {
    // If explicitly overridden, return override value
    if (overrides[action] !== undefined) {
      return overrides[action];
    }
    // Else fall back to role default
    const roleDefault = ROLE_DEFAULTS[role] || [];
    return roleDefault.includes(action);
  };

  const handleToggle = (action: string) => {
    const currentVal = isAllowed(action);
    const roleDefaultVal = (ROLE_DEFAULTS[role] || []).includes(action);
    
    const nextVal = !currentVal;
    
    // If the next value matches the role default, we can delete the override entry!
    if (nextVal === roleDefaultVal) {
      const copy = { ...overrides };
      delete copy[action];
      setOverrides(copy);
    } else {
      setOverrides({
        ...overrides,
        [action]: nextVal,
      });
    }
  };

  const handleResetRow = (action: string) => {
    const copy = { ...overrides };
    delete copy[action];
    setOverrides(copy);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(member.user_id, overrides);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-xs animate-fade-in" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-[460px] bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#E4E4F0] animate-in slide-in-from-right duration-200">
        
        {/* Sticky Header */}
        <div className="px-6 py-4.5 border-b border-[#E4E4F0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#EEF2FF] border border-brand-light text-brand text-sm font-bold flex items-center justify-center shrink-0">
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#151328]">{member.user.name}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E0E7FF] text-[#4338CA] uppercase tracking-wide">
                  {t(`members.roleLabels.${role}`) || role}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">{member.user.phone}</span>
            </div>
          </div>
          
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-Header text */}
        <div className="px-6 py-3 bg-[#F8FAFC] border-b border-[#E4E4F0] shrink-0">
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
            {t("members.editPermissionsSubtitle").replace("{role}", t(`members.roleLabels.${role}`) || role)}
          </p>
        </div>

        {/* Scrollable list of permissions */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.key} className="space-y-3">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b pb-1">
                {t(`members.groups.${group.key}`) || group.label}
              </h4>
              
              <div className="divide-y divide-slate-100">
                {group.actions.map((action) => {
                  const allowed = isAllowed(action);
                  const isOverridden = overrides[action] !== undefined;
                  const labelKey = `members.actions.${action}`;
                  const labelText = t(labelKey) || action;
                  
                  return (
                    <div key={action} className="py-3 flex items-start justify-between gap-4 group">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#151328] block leading-tight">
                          {labelText}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {isOverridden ? (
                            <>
                              <span className="inline-flex items-center px-1 rounded text-[8px] font-bold bg-[#EEF2FF] text-[#4338CA] border border-brand-light uppercase">
                                {t("members.overrideBadge") || "Custom override"}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleResetRow(action)}
                                className="text-[9px] font-bold text-slate-400 hover:text-[#4338CA] hover:underline cursor-pointer"
                              >
                                {t("members.resetDefault") || "Reset to default"}
                              </button>
                            </>
                          ) : (
                            <span className="inline-flex items-center px-1 rounded text-[8px] font-bold bg-slate-50 text-slate-400 border border-slate-100 uppercase">
                              {t("members.defaultBadge").replace("{role}", t(`members.roleLabels.${role}`) || role)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Custom Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggle(action)}
                        className={cn(
                          "relative inline-flex h-5.5 w-10.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-1",
                          allowed ? "bg-[#4338CA]" : "bg-[#C7C7E0]"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                            allowed ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sticky Footer */}
        <div className="px-6 py-4 border-t border-[#E4E4F0] bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#C7C7E0] text-slate-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 transition-colors"
          >
            {t("catalog.cancel") || "Cancel"}
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 bg-[#FF6B5B] hover:bg-[#E05344] text-white rounded-lg text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("members.saveChanges") || "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}
