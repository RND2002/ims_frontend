"use client";

import React from "react";
import { X, Package, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import { ImportBatchStatus } from "@/lib/types/imports";
import { useGetImportBatchByIdQuery } from "@/lib/features/purchases/purchasesApi";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface BatchDetailPanelProps {
  batchId: string | null;
  supplierName: string | null;
  onClose: () => void;
}

function StatusBadge({ status }: { status: ImportBatchStatus }) {
  switch (status) {
    case ImportBatchStatus.Committed:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]">
          <CheckCircle className="h-3 w-3" />
          Committed
        </span>
      );
    case ImportBatchStatus.Discarded:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]">
          <XCircle className="h-3 w-3" />
          Discarded
        </span>
      );
    case ImportBatchStatus.PendingReview:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]">
          <AlertTriangle className="h-3 w-3" />
          Pending Review
        </span>
      );
    case ImportBatchStatus.Processing:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E0E7FF] text-[#4338CA] border border-[#C7C7E0] animate-pulse">
          <Clock className="h-3 w-3 animate-spin" />
          Processing
        </span>
      );
    default:
      return null;
  }
}

export function BatchDetailPanel({ batchId, supplierName, onClose }: BatchDetailPanelProps) {
  const { language } = useLanguage();

  const { data: batch, isLoading } = useGetImportBatchByIdQuery(batchId!, {
    skip: !batchId,
  });

  if (!batchId) return null;

  const lineItems = batch?.line_items ?? [];
  const grandTotal = lineItems.reduce((sum, item) => sum + (Number(item.raw_amount) || 0), 0);

  const formatDate = (dateStr: string, includeTime = false) =>
    new Date(dateStr).toLocaleDateString(language === "hi" ? "hi-IN" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col font-sans">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#E4E4F0]">
          <div>
            <h2 className="text-sm font-extrabold text-[#151328]">Import Details</h2>
            {batch && (
              <p className="text-xs text-[#65637D] font-medium mt-0.5 leading-relaxed">
                <span className="font-semibold text-[#151328]">
                  {supplierName || "Unlinked Supplier"}
                </span>
                {batch.bill_no && (
                  <> &middot; <span className="font-mono">Bill: {batch.bill_no}</span></>
                )}
                {" \u00b7 "}
                {formatDate(batch.created_at)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 ml-3"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : lineItems.length > 0 ? (
            <div className="divide-y divide-[#F0F0F8]">
              {/* Summary strip */}
              <div className="px-5 py-3 bg-[#F7F7FB] flex items-center justify-between sticky top-0 z-10">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  {lineItems.length} line items
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Total&nbsp;
                  <span className="text-[#151328] text-xs normal-case">
                    &#x20B9;{grandTotal.toFixed(2)}
                  </span>
                </span>
              </div>

              {/* Line items */}
              {lineItems.map((item, idx) => (
                <div key={item.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-[#FAFAFA] transition-colors">
                  {/* Row number */}
                  <span className="h-6 w-6 rounded-md bg-[#EEF2FF] text-[#4338CA] text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>

                  {/* Description + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#151328] leading-snug truncate">
                      {item.raw_description || "Unknown Item"}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {item.raw_unit_text && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.raw_unit_text}
                        </span>
                      )}
                      {item.raw_qty !== null && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Qty: <span className="font-semibold text-slate-500">{item.raw_qty}</span>
                        </span>
                      )}
                      {item.raw_rate !== null && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          @ &#x20B9;{Number(item.raw_rate).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <span className="text-sm font-extrabold text-[#151328] shrink-0 tabular-nums">
                    &#x20B9;{Number(item.raw_amount || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
              <Package className="h-9 w-9 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-400">No line items available</p>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Items may not have been saved for this batch.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {batch && (
          <div className="px-5 py-4 border-t border-[#E4E4F0] bg-[#F7F7FB]">
            <div className="flex items-center justify-between gap-3">
              <StatusBadge status={batch.status} />
              {batch.committed_at && (
                <span className="text-[11px] text-slate-400 font-medium">
                  Committed {formatDate(batch.committed_at, true)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
