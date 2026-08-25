"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { store } from "@/lib/store";
import { createApiClient } from "@/lib/apiClient";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { StoreRole } from "@/lib/enums";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { Users, UserPlus, Trash2, CheckCircle2, X } from "lucide-react";

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
}

interface InviteRow {
  id: string;
  phone: string;
  role: StoreRole;
  status: "idle" | "sending" | "sent" | "error";
  error?: string;
}

function makeRow(): InviteRow {
  return { id: crypto.randomUUID(), phone: "", role: StoreRole.STAFF, status: "idle" };
}

export function InviteMemberDialog({ isOpen, onClose, onSkip }: InviteMemberDialogProps) {
  const { activeStore } = useAppSelector((state) => state.stores);
  const { t } = useLanguage();
  const [rows, setRows] = useState<InviteRow[]>([makeRow()]);
  const [sending, setSending] = useState(false);
  const [allSent, setAllSent] = useState(false);

  if (!isOpen) return null;

  // Build role options from translations
  const ROLE_OPTIONS = [
    { value: StoreRole.MANAGER, label: t("inviteMember.roles.manager") },
    { value: StoreRole.STAFF, label: t("inviteMember.roles.staff") },
    { value: StoreRole.ACCOUNTANT, label: t("inviteMember.roles.accountant") },
    { value: StoreRole.VIEWER, label: t("inviteMember.roles.viewer") },
  ];

  const ROLE_DESC: Record<string, string> = {
    [StoreRole.MANAGER]: t("inviteMember.roleDesc.manager"),
    [StoreRole.STAFF]: t("inviteMember.roleDesc.staff"),
    [StoreRole.ACCOUNTANT]: t("inviteMember.roleDesc.accountant"),
    [StoreRole.VIEWER]: t("inviteMember.roleDesc.viewer"),
  };

  const updateRow = (id: string, patch: Partial<InviteRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const addRow = () => {
    setRows((prev) => [...prev, makeRow()]);
  };

  const validatePhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (!digits) return t("inviteMember.phoneRequired");
    if (digits.length !== 10) return t("inviteMember.phoneMustBe10");
    return null;
  };

  const handleSendAll = async () => {
    let hasError = false;
    setRows((prev) =>
      prev.map((r) => {
        const err = validatePhone(r.phone);
        if (err) { hasError = true; return { ...r, error: err }; }
        return { ...r, error: undefined };
      })
    );
    if (hasError) return;

    setSending(true);

    const client = createApiClient(() => store.getState());
    const results = await Promise.allSettled(
      rows.map(async (row) => {
        updateRow(row.id, { status: "sending" });
        await client.post(
          API_ENDPOINTS.backend.stores.inviteMember,
          { phone: "+91" + row.phone, role: row.role }
        );
        return row.id;
      })
    );

    results.forEach((result, i) => {
      const id = rows[i].id;
      if (result.status === "fulfilled") {
        updateRow(id, { status: "sent" });
      } else {
        const msg = (result.reason as any)?.message;
        updateRow(id, {
          status: "error",
          error: typeof msg === "string" ? msg : t("inviteMember.failedToSend"),
        });
      }
    });

    setSending(false);
    const allSucceeded = results.every((r) => r.status === "fulfilled");
    if (allSucceeded) setAllSent(true);
  };

  const sentCount = rows.filter((r) => r.status === "sent").length;
  const hasAnySent = sentCount > 0;

  const sendLabel = sending
    ? t("inviteMember.sending")
    : rows.length === 1
    ? t("inviteMember.sendInvite")
    : t("inviteMember.sendInvites").replace("{n}", String(rows.length));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4">
      {/* Backdrop */}
      <div onClick={onSkip} className="absolute inset-0 bg-[#151328]/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#E4E4F0] bg-white shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-7 py-5 border-b border-[#E4E4F0] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-brand-light border border-brand/20">
              <Users className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#151328] leading-none">
                {t("inviteMember.title")}
              </h2>
              <p className="text-[12px] text-[#65637D] font-medium mt-1">
                {t("inviteMember.subtitle")}{" "}
                <span className="font-bold text-[#151328]">
                  {activeStore?.name || t("inviteMember.subtitleStore")}
                </span>{" "}
                {t("inviteMember.subtitleEnd")}
              </p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="rounded-lg p-1.5 text-[#65637D] hover:bg-[#F7F7FB] transition-colors cursor-pointer outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-7 py-5">
          {allSent ? (
            /* All sent success state */
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-50 border border-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#151328]">
                  {sentCount}{" "}
                  {sentCount !== 1
                    ? t("inviteMember.successTitlePlural")
                    : t("inviteMember.successTitle")}
                </h3>
                <p className="text-xs text-[#65637D] mt-1 font-medium max-w-[320px] mx-auto">
                  {t("inviteMember.successDesc")}{" "}
                  <span className="font-semibold text-[#151328]">{activeStore?.name}</span>.{" "}
                  {t("inviteMember.successDescEnd")}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Info banner */}
              <div className="rounded-xl bg-brand-light/60 border border-brand/10 px-4 py-3 mb-5">
                <p className="text-[11px] font-semibold text-brand leading-relaxed">
                  {t("inviteMember.infoBanner")}
                </p>
              </div>

              {/* Invite rows */}
              <div className="flex flex-col gap-3">
                {rows.map((row, idx) => (
                  <div
                    key={row.id}
                    className={`relative rounded-xl border p-4 transition-all ${
                      row.status === "sent"
                        ? "border-green-200 bg-green-50/50"
                        : row.status === "error"
                        ? "border-danger-text/30 bg-danger-bg/30"
                        : "border-[#E4E4F0] bg-[#F7F7FB]/60"
                    }`}
                  >
                    {/* Row header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-[#65637D] uppercase tracking-wider">
                        {t("inviteMember.memberLabel")} {idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {row.status === "sent" && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> {t("inviteMember.done")}
                          </span>
                        )}
                        {row.status === "error" && (
                          <span className="text-[11px] font-bold text-danger-text bg-danger-bg px-2 py-0.5 rounded-full">
                            {t("inviteMember.failedToSend")}
                          </span>
                        )}
                        {rows.length > 1 && row.status === "idle" && (
                          <button
                            onClick={() => removeRow(row.id)}
                            className="p-1 rounded-lg text-[#65637D] hover:bg-[#E4E4F0] hover:text-danger-text transition-colors cursor-pointer outline-none"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
                      {/* Phone */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-semibold text-text-secondary leading-none">
                          {t("inviteMember.mobileLabel")}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-secondary select-none">
                            +91
                          </span>
                          <input
                            type="tel"
                            placeholder={t("inviteMember.mobilePlaceholder")}
                            value={row.phone}
                            disabled={row.status === "sent" || row.status === "sending"}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                              updateRow(row.id, { phone: val, error: undefined });
                            }}
                            className={`flex h-10 w-full rounded-lg border bg-bg-surface pl-12 pr-3 py-2 text-sm font-medium text-text-primary transition-all duration-200 outline-none placeholder:text-text-secondary/40 focus-visible:border-2 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand-light/50 disabled:opacity-60 disabled:cursor-not-allowed ${
                              row.error
                                ? "border-danger-text focus-visible:border-danger-text focus-visible:ring-2 focus-visible:ring-danger-bg"
                                : "border-border-default"
                            }`}
                          />
                        </div>
                        {row.error && (
                          <span className="text-[11px] font-medium text-danger-text">{row.error}</span>
                        )}
                      </div>

                      {/* Role */}
                      <div className="w-44">
                        <Select
                          label={t("inviteMember.roleLabel")}
                          value={row.role}
                          disabled={row.status === "sent" || row.status === "sending"}
                          onChange={(e) => updateRow(row.id, { role: e.target.value as StoreRole })}
                          options={ROLE_OPTIONS}
                        />
                        <p className="text-[10px] text-[#65637D] font-medium mt-1 leading-tight">
                          {ROLE_DESC[row.role]}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add another */}
              <button
                onClick={addRow}
                className="mt-3 flex items-center gap-2 text-xs font-bold text-brand hover:text-brand-dark transition-colors cursor-pointer outline-none py-1"
              >
                <UserPlus className="h-4 w-4" />
                {t("inviteMember.addAnother")}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-[#E4E4F0] shrink-0">
          {allSent ? (
            <div className="flex gap-3">
              <Button
                onClick={() => { setRows([makeRow()]); setAllSent(false); }}
                variant="outline"
                size="md"
                className="flex-1 cursor-pointer"
              >
                {t("inviteMember.inviteMore")}
              </Button>
              <Button
                onClick={onClose}
                variant="cta"
                size="md"
                className="flex-1 cursor-pointer font-bold"
              >
                {t("inviteMember.goToDashboard")}
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={onSkip}
                variant="outline"
                size="md"
                className="flex-1 cursor-pointer text-[#65637D]"
              >
                {hasAnySent ? t("inviteMember.done") : t("inviteMember.skipForNow")}
              </Button>
              <Button
                onClick={handleSendAll}
                disabled={sending}
                variant="cta"
                size="md"
                className="flex-1 cursor-pointer font-bold"
              >
                {sendLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
