"use client";

import React, { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createApiClient } from "@/lib/apiClient";
import { store } from "@/lib/store";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { X, Loader2 } from "lucide-react";

interface AddContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  partyType: "customer" | "supplier";
  onSuccess: () => void;
}

export function AddContactDialog({ isOpen, onClose, partyType, onSuccess }: AddContactDialogProps) {
  const { t } = useLanguage();
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newOpeningBalance, setNewOpeningBalance] = useState("0");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      setErrorMsg("Name and mobile number are required");
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const client = createApiClient(store.getState);
      await client.post(API_ENDPOINTS.backend.parties.base, {
        name: newName,
        phone: newPhone,
        party_type: partyType,
        address: newAddress || undefined,
        opening_balance: parseFloat(newOpeningBalance) || 0,
      });
      // Reset form fields
      setNewName("");
      setNewPhone("");
      setNewAddress("");
      setNewOpeningBalance("0");
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-[#E4E4F0] animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="font-bold text-[#151328] text-base">{t("ledgers.addContactModalTitle")}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 mb-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">{t("ledgers.name")} *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Kumar"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">{t("ledgers.phone")} *</label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="e.g. 9876543210"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
              className="w-full h-10 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">{t("ledgers.openingBalance")} (₹)</label>
            <input
              type="number"
              step="0.01"
              value={newOpeningBalance}
              onChange={(e) => setNewOpeningBalance(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono font-semibold"
            />
            <span className="text-[10px] text-slate-400 block mt-1 leading-normal">
              {partyType === "customer"
                ? "Credit Due: positive value (Customer owes you). Advance payment: negative value."
                : "Due balance: negative value (You owe supplier). Advance payment: positive value."}
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">{t("ledgers.address")}</label>
            <textarea
              placeholder="Sector 62, Noida"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full h-16 p-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-semibold"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full h-10 bg-brand text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-indigo-700 flex items-center justify-center transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("ledgers.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
