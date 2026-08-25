"use client";

import React from "react";
import { Product } from "@/lib/types/catalog";
import { ProductRow } from "./ProductRow";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductsTableProps {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectRow: (productId: string, checked: boolean) => void;
  onEditRow: (product: Product) => void;
  onDuplicateRow: (product: Product) => void;
  onDeleteRow: (productId: string) => void;
  onPageChange: (offset: number) => void;
}

export function ProductsTable({
  products,
  total,
  limit,
  offset,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onEditRow,
  onDuplicateRow,
  onDeleteRow,
  onPageChange,
}: ProductsTableProps) {
  const { t } = useLanguage();

  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  // Calculate current showing range
  const startRange = total === 0 ? 0 : offset + 1;
  const endRange = Math.min(offset + limit, total);

  // Pagination totals
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const handlePageClick = (page: number) => {
    const newOffset = (page - 1) * limit;
    onPageChange(newOffset);
  };

  const columns = [
    { label: t("catalog.fields.product") },
    { label: t("catalog.fields.skuCol") },
    { label: t("catalog.fields.categoryCol") },
    { label: t("catalog.fields.stockQtyCol"), align: "text-right" },
    { label: t("catalog.fields.unitCostCol"), align: "text-right" },
    { label: t("catalog.fields.sellingPriceCol"), align: "text-right" },
    { label: t("catalog.fields.statusCol") },
  ];

  return (
    <div className="bg-white rounded-b-xl border border-[#E4E4F0] border-t-0 flex flex-col font-sans select-none overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[900px]">
        {/* Table Head */}
        <thead>
          <tr className="bg-[#F7F7FB] border-b border-[#C7C7E0]">
            <th className="px-4 py-3 w-10 text-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#4338CA] focus:ring-[#4338CA] cursor-pointer"
              />
            </th>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={cn(
                  "px-4 py-3 text-[10px] uppercase font-bold tracking-wider text-[#65637D] select-none",
                  col.align || "text-left"
                )}
              >
                <div
                  className={cn(
                    "inline-flex items-center gap-1 group cursor-pointer hover:text-[#4338CA]",
                    col.align === "text-right" && "justify-end w-full"
                  )}
                >
                  {col.label}
                  <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-[#4338CA] transition-colors" />
                </div>
              </th>
            ))}
            <th className="px-4 py-3 w-12 text-right"></th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              isSelected={selectedIds.includes(product.id)}
              onSelect={(checked) => onSelectRow(product.id, checked)}
              onEdit={() => onEditRow(product)}
              onDuplicate={() => onDuplicateRow(product)}
              onDelete={() => onDeleteRow(product.id)}
            />
          ))}
        </tbody>
      </table>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-[#E4E4F0] bg-white px-6 py-4 rounded-b-xl">
        <span className="text-xs font-semibold text-[#65637D]">
          {t("catalog.showing")
            .replace("{start}", String(startRange))
            .replace("{end}", String(endRange))
            .replace("{total}", String(total))}
        </span>

        {/* Page Selector controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageClick(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#E4E4F0] text-[#65637D] hover:bg-[#F7F7FB] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = currentPage === pageNum;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageClick(pageNum)}
                  className={cn(
                    "h-8 w-8 text-xs font-bold rounded-lg transition-colors cursor-pointer outline-none",
                    isActive
                      ? "bg-[#4338CA] text-white"
                      : "text-[#65637D] hover:bg-[#F7F7FB]"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageClick(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#E4E4F0] text-[#65637D] hover:bg-[#F7F7FB] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
