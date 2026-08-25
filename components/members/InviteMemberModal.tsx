"use client";

import React, { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { StoreRole } from "@/lib/types/members";
import { X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (phone: string, role: StoreRole) => Promise<void>;
  loading: boolean;
}

export function InviteMemberModal({ isOpen, onClose, onInvite, loading }: InviteMemberModalProps) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<StoreRole>("staff");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length !== 10) {
      setValidationError("Phone number must be exactly 10 digits");
      return;
    }
    try {
      await onInvite(cleanedPhone, selectedRole);
      setPhone("");
      setSelectedRole("staff");
      onClose();
    } catch (err: any) {
      setValidationError(err.message || "Failed to invite member");
    }
  };

  const rolesList: { role: StoreRole; title: string; desc: string }[] = [
    {
      role: "manager",
      title: t("members.roleLabels.manager") || "Manager",
      desc: t("members.roleDescs.manager") || "Full access except owner-level actions",
    },
    {
      role: "staff",
      title: t("members.roleLabels.staff") || "Staff",
      desc: t("members.roleDescs.staff") || "Can manage sales, stock, and customer ledgers",
    },
    {
      role: "accountant",
      title: t("members.roleLabels.accountant") || "Accountant",
      desc: t("members.roleDescs.accountant") || "No default access; permissions set manually",
    },
    {
      role: "viewer",
      title: t("members.roleLabels.viewer") || "Viewer",
      desc: t("members.roleDescs.viewer") || "Read-only access to all data",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs animate-fade-in" onClick={onClose} />
      
      {/* Content panel */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#E4E4F0] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#E4E4F0] flex items-center justify-between">
          <h3 className="font-bold text-[#151328] text-base">{t("members.inviteMemberTitle") || "Invite Member"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {validationError && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg">
              {validationError}
            </div>
          )}

          {/* Mobile input */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">
              {t("members.phoneLabel") || "Mobile Number"} *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm font-bold text-slate-400 select-none">
                +91
              </span>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full h-10 pl-11 pr-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand font-bold"
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1.5">
              {t("members.phoneHelper") || "They'll receive an invite via SMS to join this store."}
            </span>
          </div>

          {/* Role selectable cards */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 block">
              {t("members.roleCol") || "Role"} *
            </label>
            
            <div className="space-y-2">
              {rolesList.map((item) => {
                const isSelected = selectedRole === item.role;
                return (
                  <div
                    key={item.role}
                    onClick={() => setSelectedRole(item.role)}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer relative flex justify-between items-start gap-3",
                      isSelected
                        ? "border-[#4338CA] bg-[#EEF2FF] shadow-xs"
                        : "border-[#E4E4F0] hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-[#151328] block">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold leading-normal block">
                        {item.desc}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="h-4.5 w-4.5 rounded-full bg-[#4338CA] text-white flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 stroke-[3px]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-[#E4E4F0] flex gap-3 justify-end shrink-0">
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
            disabled={loading}
            className="px-5 py-2 bg-[#FF6B5B] hover:bg-[#E05344] text-white rounded-lg text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("members.sendInvite") || "Send Invite"}
          </button>
        </div>

      </div>
    </div>
  );
}
