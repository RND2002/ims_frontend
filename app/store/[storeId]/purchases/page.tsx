"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ImportBatch, ImportBatchStatus } from "@/lib/types/imports";
import {
  useGetImportBatchesQuery,
  useGetSuppliersQuery,
} from "@/lib/features/purchases/purchasesApi";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileSpreadsheet,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  User,
  Calendar,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ManualPurchasePanel } from "@/components/purchases/ManualPurchasePanel";
import { BatchDetailPanel } from "@/components/purchases/BatchDetailPanel";

export default function PurchasesImportsListPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const { language, t } = useLanguage();

  // Pagination states
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [isManualPurchaseOpen, setIsManualPurchaseOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // RTK Query fetches
  const { data: batchesData, isLoading: loading, refetch } = useGetImportBatchesQuery(
    { limit, offset },
    { skip: !storeId }
  );

  const batches = batchesData?.items || [];
  const total = batchesData?.total || 0;

  const { data: parties = [] } = useGetSuppliersQuery(undefined, { skip: !storeId });

  const isCsvFile = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
      const path = url.split("?")[0];
      return path.toLowerCase().endsWith(".csv");
    } catch {
      return false;
    }
  };

  // Find supplier name helper
  const getSupplierName = (partyId: string | null) => {
    if (!partyId) return null;
    const found = parties.find((p) => p.id === partyId);
    return found ? found.name : null;
  };

  const getStatusBadge = (status: ImportBatchStatus) => {
    switch (status) {
      case ImportBatchStatus.Processing:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E0E7FF] text-[#4338CA] border border-[#C7C7E0] animate-pulse">
            <Clock className="h-3 w-3 animate-spin" />
            {t("imports.status.processing")}
          </span>
        );
      case ImportBatchStatus.PendingReview:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]">
            <AlertTriangle className="h-3 w-3" />
            {t("imports.status.pending_review")}
          </span>
        );
      case ImportBatchStatus.Committed:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]">
            <CheckCircle className="h-3 w-3" />
            {t("imports.status.committed")}
          </span>
        );
      case ImportBatchStatus.Discarded:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]">
            <XCircle className="h-3 w-3" />
            {t("imports.status.discarded")}
          </span>
        );
      case ImportBatchStatus.Failed:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]">
            <XCircle className="h-3 w-3" />
            {t("imports.status.failed")}
          </span>
        );
      default:
        return null;
    }
  };

  const handleRowClick = (batch: ImportBatch) => {
    if (
      batch.status === ImportBatchStatus.PendingReview ||
      batch.status === ImportBatchStatus.Processing
    ) {
      router.push(`/store/${storeId}/purchases/import?batch_id=${batch.id}`);
    } else if (
      batch.status === ImportBatchStatus.Committed ||
      batch.status === ImportBatchStatus.Discarded
    ) {
      setSelectedBatchId(batch.id);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-[#151328] tracking-tight">
            {t("imports.list.title")}
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-[#65637D]">
            {t("imports.list.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="h-9.5 px-3 border-[#E4E4F0] bg-white text-[#65637D] hover:bg-[#F7F7FB]"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>

          <Button
            onClick={() => setIsManualPurchaseOpen(true)}
            className="h-9.5 px-4 bg-brand hover:bg-indigo-750 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none"
          >
            <Plus className="h-3.5 w-3.5" />
            Add  Purchase
          </Button>

          <Button
            onClick={() => router.push(`/store/${storeId}/purchases/import`)}
            className="h-9.5 px-4 bg-[#FF6B5B] hover:bg-[#E05344] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none"
          >
            <Upload className="h-3.5 w-3.5" />
            {t("imports.list.importButton")}
          </Button>
        </div>
      </div>

      {/* Main List Area */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-[#E4E4F0] rounded-xl animate-pulse p-6 flex flex-col justify-between" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white border border-[#E4E4F0] rounded-xl p-12 text-center max-w-xl mx-auto mt-6">
          <div className="h-14 w-14 rounded-full bg-[#EEF2FF] border border-[#C7C7E0] flex items-center justify-center mx-auto text-[#4338CA] mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-extrabold text-[#151328] mb-1.5">
            {t("imports.list.emptyTitle")}
          </h3>
          <p className="text-xs text-[#65637D] font-medium leading-relaxed max-w-sm mx-auto mb-6">
            {t("imports.list.emptySubtitle")}
          </p>
          <Button
            onClick={() => router.push(`/store/${storeId}/purchases/import`)}
            className="bg-[#4338CA] hover:bg-[#372f9f] text-white text-xs font-bold px-5 py-5 rounded-lg"
          >
            {t("imports.list.uploadFirstButton")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3.5">
            {batches.map((batch) => {
              const supplierName = getSupplierName(batch.party_id);
              // line_items is NOT included in list responses — use line_items_count summary
              const itemsCount = batch.line_items_count ?? null;
              const dateStr = new Date(batch.created_at).toLocaleDateString(
                language === "hi" ? "hi-IN" : "en-US",
                { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
              );

              return (
                <div
                  key={batch.id}
                  onClick={() => handleRowClick(batch)}
                  className={cn(
                    "bg-white border border-[#E4E4F0] rounded-xl p-5 hover:border-[#4338CA]/40 transition-all select-none shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4",
                    (batch.status === ImportBatchStatus.PendingReview ||
                      batch.status === ImportBatchStatus.Committed ||
                      batch.status === ImportBatchStatus.Discarded) && "cursor-pointer hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-lg border border-[#E4E4F0] bg-[#F7F7FB] flex items-center justify-center shrink-0 text-[#65637D]">
                      {batch.source_image_url && !isCsvFile(batch.source_image_url) ? (
                        <img
                          src={batch.source_image_url}
                          alt="Invoice Thumbnail"
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5 text-[#4338CA]" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-sm font-extrabold text-[#151328]">
                          {supplierName || (
                            <span className="text-slate-400 font-bold italic">
                              {t("imports.list.unlinkedSupplier")}
                            </span>
                          )}
                        </span>
                        {getStatusBadge(batch.status)}
                      </div>

                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-[#65637D] font-medium">
                        <span className="flex items-center gap-1 font-mono">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          Bill: {batch.bill_no || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {dateStr}
                        </span>
                        {/* <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          Uploaded by: {batch.uploaded_by || "System"}
                        </span> */}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    {itemsCount !== null && (
                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block leading-none mb-1">
                          {t("imports.list.totalItems")}
                        </span>
                        <span className="text-sm font-extrabold text-[#151328]">
                          {itemsCount} {t("imports.list.items")}
                        </span>
                      </div>
                    )}

                    {batch.status === ImportBatchStatus.PendingReview && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/store/${storeId}/purchases/import?batch_id=${batch.id}`);
                        }}
                        className="py-4 px-3.5 text-xs font-extrabold bg-[#4338CA] hover:bg-[#372f9f] text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {t("imports.list.review")}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          {total > limit && (
            <div className="flex items-center justify-between border-t border-[#E4E4F0] pt-4.5">
              <span className="text-xs text-[#65637D] font-semibold">
                Showing <span className="font-bold text-[#151328]">{offset + 1}</span> to{" "}
                <span className="font-bold text-[#151328]">
                  {Math.min(offset + limit, total)}
                </span>{" "}
                of <span className="font-bold text-[#151328]">{total}</span> imports
              </span>

              <div className="flex gap-2">
                <Button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  variant="outline"
                  className="h-8.5 px-2.5 border-[#E4E4F0] disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  variant="outline"
                  className="h-8.5 px-2.5 border-[#E4E4F0] disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Purchase Panel */}
      <ManualPurchasePanel
        isOpen={isManualPurchaseOpen}
        onClose={() => setIsManualPurchaseOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Batch Detail Slide-Over */}
      <BatchDetailPanel
        batchId={selectedBatchId}
        supplierName={selectedBatchId ? getSupplierName(
          batches.find((b) => b.id === selectedBatchId)?.party_id ?? null
        ) : null}
        onClose={() => setSelectedBatchId(null)}
      />
    </div>
  );
}
