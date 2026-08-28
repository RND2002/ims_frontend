"use client";

import React, { useState, useEffect, useRef } from "react";
import { Product } from "@/lib/types/catalog";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useGetCategoriesQuery } from "@/lib/features/catalog/catalogApi";
import { MoreHorizontal, FileEdit, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductRowProps {
  product: Product;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ProductRow({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: ProductRowProps) {
  const { t } = useLanguage();
  const { data: categories = [] } = useGetCategoriesQuery();
  const matchedCategory = categories.find((c) => c.id === product.category_id);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLTableCellElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isLowStock = product.current_stock <= product.reorder_level && product.current_stock > 0;
  const isOutOfStock = product.current_stock === 0;

  let statusBadge = (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
      {t("catalog.inStock")}
    </span>
  );
  if (isOutOfStock) {
    statusBadge = (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
        {t("catalog.outOfStock")}
      </span>
    );
  } else if (isLowStock) {
    statusBadge = (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
        {t("catalog.lowStock")}
      </span>
    );
  }

  // Format currency with ₹ symbol and tabular numbers formatting
  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <tr
      className={cn(
        "group border-b border-[#E4E4F0] last:border-0 hover:bg-[#F7F7FB] transition-colors relative font-sans align-middle",
        isSelected && "bg-[#F7F7FB]"
      )}
    >
      {/* Edit button column */}
      <td className="px-4 py-3.5 w-12 text-center select-none">
        <button
          onClick={onEdit}
          className="h-8.5 w-8.5 rounded-lg border border-[#E4E4F0] bg-white text-[#65637D] hover:text-[#4338CA] hover:bg-[#F7F7FB] flex items-center justify-center transition-all cursor-pointer outline-none mx-auto"
          title="Edit Product"
        >
          <FileEdit className="h-4 w-4" />
        </button>
      </td>

      {/* Product Name & SKU merged column */}
      <td className="px-4 py-3.5 max-w-[200px]">
        <div className="min-w-0">
          <span className="block text-sm font-semibold text-[#151328] truncate hover:text-[#4338CA] cursor-pointer" onClick={onEdit}>
            {product.name}
          </span>
          <span className="block text-[11px] font-medium text-[#65637D] truncate mt-0.5">
            {product.sku ? `${product.sku} • ` : ""}Qty: {product.current_stock} • Price: {formatCurrency(product.selling_price)}
          </span>
        </div>
      </td>

      {/* SKU separate column */}
      <td className="px-4 py-3.5 text-xs font-semibold text-[#65637D] hidden md:table-cell">
        {product.sku || "—"}
      </td>

      {/* Category column */}
      <td className="px-4 py-3.5 hidden sm:table-cell">
        {matchedCategory || product.category ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-[#F7F7FB] text-[#65637D] border border-[#E4E4F0]">
            {matchedCategory?.name || product.category?.name}
          </span>
        ) : (
          <span className="text-xs text-text-secondary/50">—</span>
        )}
      </td>

      {/* Stock Quantity Column */}
      <td className="px-4 py-3.5 text-right font-medium text-sm text-[#151328]">
        <div className="inline-flex items-center gap-1.5 tabular-nums">
          {(isLowStock || isOutOfStock) && (
            <span className={cn("h-1.5 w-1.5 rounded-full", isOutOfStock ? "bg-red-500 animate-pulse" : "bg-amber-500")} />
          )}
          {product.current_stock}
        </div>
      </td>

      {/* Cost Price */}
      <td className="px-4 py-3.5 text-right text-sm font-semibold text-[#151328] tabular-nums hidden md:table-cell">
        {formatCurrency(product.cost_price)}
      </td>

      {/* Selling Price */}
      <td className="px-4 py-3.5 text-right text-sm font-semibold text-[#151328] tabular-nums">
        {formatCurrency(product.selling_price)}
      </td>

      {/* Status Badges */}
      <td className="px-4 py-3.5 hidden lg:table-cell">{statusBadge}</td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-right relative w-12" ref={dropdownRef}>
        <div className="flex items-center justify-end">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="hover:bg-[#E4E4F0] p-1.5 rounded-lg text-[#65637D] hover:text-[#151328] transition-all cursor-pointer outline-none shrink-0"
          >
            <MoreHorizontal className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Dropdown Menu list */}
        {isMenuOpen && (
          <div className="absolute right-4 top-[35px] z-30 w-36 rounded-xl border border-[#E4E4F0] bg-white shadow-xl py-1 animate-in fade-in slide-in-from-top-1.5 duration-100 select-none text-left">
            <button
              onClick={() => {
                onEdit();
                setIsMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[#151328] hover:bg-[#F7F7FB] transition-colors cursor-pointer outline-none"
            >
              <FileEdit className="h-3.5 w-3.5 text-[#65637D]" />
              {t("catalog.edit")}
            </button>
            <button
              onClick={() => {
                onDuplicate();
                setIsMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[#151328] hover:bg-[#F7F7FB] transition-colors cursor-pointer outline-none"
            >
              <Copy className="h-3.5 w-3.5 text-[#65637D]" />
              {t("catalog.duplicate")}
            </button>
            <div className="border-t border-[#E4E4F0] my-1" />
            <button
              onClick={() => {
                onDelete();
                setIsMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer outline-none"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
              {t("catalog.delete")}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
