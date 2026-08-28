"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useRecordPaymentMutation } from "@/lib/features/ledgers/ledgersApi";
import { Party } from "@/lib/types/sales";
import { X, Loader2 } from "lucide-react";

interface RecordPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  party: Party | null;
  onSuccess: () => void;
}

export function RecordPaymentDialog({ isOpen, onClose, party, onSuccess }: RecordPaymentDialogProps) {
  const { t } = useLanguage();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"debit" | "credit">("credit");
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card" | "bank_transfer">("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  const [recordPayment, { isLoading: saving }] = useRecordPaymentMutation();

  // Sync default transaction type when dialog opens
  useEffect(() => {
    if (party) {
      setPaymentType(party.party_type === "customer" ? "credit" : "debit");
    }
  }, [party]);

  if (!isOpen || !party) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg("Please enter a valid positive payment amount");
      return;
    }
    setErrorMsg(null);
    try {
      const direction = paymentType === "credit" ? "received" : "paid";
      await recordPayment({
        party_id: party.id,
        amount: amt,
        entry_type: paymentType,
        payment_mode: paymentMode,
        direction: direction,
        note: paymentNote || undefined,
      }).unwrap();
      setPaymentSuccessMsg(t("ledgers.paymentSuccess"));
      setPaymentAmount("");
      setPaymentNote("");
      setPaymentMode("cash");
      onSuccess();
      setTimeout(() => {
        setPaymentSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || t("ledgers.paymentFailed"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-[#E4E4F0] animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="font-bold text-[#151328] text-base">{t("ledgers.recordCashPayment")}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {paymentSuccessMsg && (
          <div className="p-2.5 mb-3.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg">
            {paymentSuccessMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 mb-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">{t("ledgers.amountLabel")} *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 500"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-bold font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">{t("ledgers.paymentType")} *</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as "debit" | "credit")}
              className="w-full h-10 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer font-semibold"
            >
              <option value="credit">{t("ledgers.paymentTypeIn")}</option>
              <option value="debit">{t("ledgers.paymentTypeOut")}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Payment Mode *</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full h-10 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer font-semibold"
            >
              <option value="cash">💵 Cash</option>
              <option value="upi">📱 UPI (UPI / GPay / PhonePe)</option>
              <option value="card">💳 Card</option>
              <option value="bank_transfer">🏦 Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">{t("ledgers.note")}</label>
            <input
              type="text"
              placeholder="e.g. Cash received"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-semibold"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full h-10 bg-brand text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-indigo-700 flex items-center justify-center transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("ledgers.submitPayment")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
