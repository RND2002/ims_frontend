"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Product } from "@/lib/types/catalog";
import {
  fetchProducts,
  fetchCategories,
  fetchUnits,
  fetchTaxRates,
  deleteProduct,
  createProduct,
} from "@/lib/features/catalog/catalogSlice";
import { ProductsTable } from "@/components/catalog/ProductsTable";
import { ProductPanel } from "@/components/catalog/ProductPanel";
import { ProductEmptyState } from "@/components/catalog/ProductEmptyState";
import { Search, ChevronDown, Download, Plus, AlertTriangle, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CatalogPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const dispatch = useAppDispatch();
  const { t } = useLanguage();

  // Redux Selectors
  const { products, total, limit, offset, categories, loading } = useAppSelector(
    (state) => state.catalog
  );

  // Component Local State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStockStatus, setSelectedStockStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Panel triggers
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      dispatch(
        fetchProducts({
          limit,
          offset: 0, // Reset to first page on search
          search,
          category_id: selectedCategory || undefined,
        })
      );
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedCategory, limit, dispatch]);

  // Load configuration dropdown parameters
  useEffect(() => {
    if (storeId) {
      dispatch(fetchCategories());
      dispatch(fetchUnits());
      dispatch(fetchTaxRates());
    }
  }, [storeId, dispatch]);

  const handlePageChange = (newOffset: number) => {
    dispatch(
      fetchProducts({
        limit,
        offset: newOffset,
        search,
        category_id: selectedCategory || undefined,
      })
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, productId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const handleEditRow = (product: Product) => {
    setEditingProduct(product);
    setIsPanelOpen(true);
  };

  const handleDuplicateRow = async (product: Product) => {
    try {
      await dispatch(
        createProduct({
          name: `${product.name} (Copy)`,
          sku: product.sku ? `${product.sku}-COPY` : undefined,
          barcode: product.barcode ? `${product.barcode}-COPY` : undefined,
          category_id: product.category_id,
          unit_id: product.unit_id,
          tax_rate_id: product.tax_rate_id,
          cost_price: product.cost_price,
          selling_price: product.selling_price,
          mrp: product.mrp,
          reorder_level: product.reorder_level,
          opening_stock: 0,
        })
      ).unwrap();
    } catch (err) {
      console.error("Failed to duplicate product:", err);
    }
  };

  const handleDeleteRow = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await dispatch(deleteProduct(productId)).unwrap();
        setSelectedIds((prev) => prev.filter((id) => id !== productId));
      } catch (err) {
        console.error("Failed to delete product:", err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) {
      try {
        await Promise.all(selectedIds.map((id) => dispatch(deleteProduct(id)).unwrap()));
        setSelectedIds([]);
      } catch (err) {
        console.error("Bulk delete failed:", err);
      }
    }
  };

  const handleExport = () => {
    alert("Export feature coming soon! Generates CSV of catalog listing.");
  };

  // Filter products by stock status client-side
  const getFilteredProducts = () => {
    if (!selectedStockStatus) return products;
    return products.filter((p) => {
      const isLowStock = p.current_stock <= p.reorder_level && p.current_stock > 0;
      const isOutOfStock = p.current_stock === 0;

      if (selectedStockStatus === "low_stock") return isLowStock;
      if (selectedStockStatus === "out_of_stock") return isOutOfStock;
      if (selectedStockStatus === "in_stock") return !isLowStock && !isOutOfStock;
      return true;
    });
  };

  const displayProducts = getFilteredProducts();

  // Subtitle string
  const subtitleString = t("catalog.subtitle")
    .replace("{total}", String(total))
    .replace("{categories}", String(categories.length));

  const hasNoItems = total === 0 && !search && !selectedCategory && !selectedStockStatus;

  return (
    <div className="flex flex-col gap-5 font-sans select-none min-h-screen pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#151328] tracking-tight">
            {t("catalog.title")}
          </h1>
          <p className="mt-1 text-xs text-[#65637D] font-semibold">
            {subtitleString}
          </p>
        </div>
      </div>

      {hasNoItems && !loading ? (
        <ProductEmptyState
          onAddClick={() => {
            setEditingProduct(null);
            setIsPanelOpen(true);
          }}
        />
      ) : (
        <div className="flex flex-col">
          
          {/* Toolbar panel */}
          <div className="bg-white rounded-t-xl border border-[#E4E4F0] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Left side actions (or bulk actions switch) */}
            {selectedIds.length > 0 ? (
              <div className="flex items-center gap-4 animate-in fade-in duration-150">
                <span className="text-sm font-bold text-[#151328]">
                  {t("catalog.selectedCount").replace("{n}", String(selectedIds.length))}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors cursor-pointer outline-none"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("catalog.delete")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
                
                {/* Search field */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={t("catalog.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E4E4F0] text-sm font-medium outline-none placeholder:text-text-secondary/40 focus:border-[#4338CA] focus:ring-2 focus:ring-[#EEF2FF] transition-all"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#65637D]" />
                </div>

                {/* Category Dropdown */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-10 pl-3 pr-9 rounded-lg border border-[#E4E4F0] bg-white text-xs font-bold text-[#65637D] appearance-none outline-none focus:border-[#4338CA] cursor-pointer"
                  >
                    <option value="">{t("catalog.allCategories")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#65637D] pointer-events-none" />
                </div>

                {/* Stock Status Dropdown */}
                <div className="relative">
                  <select
                    value={selectedStockStatus}
                    onChange={(e) => setSelectedStockStatus(e.target.value)}
                    className="h-10 pl-3 pr-9 rounded-lg border border-[#E4E4F0] bg-white text-xs font-bold text-[#65637D] appearance-none outline-none focus:border-[#4338CA] cursor-pointer"
                  >
                    <option value="">{t("catalog.allStockStatus")}</option>
                    <option value="in_stock">{t("catalog.inStock")}</option>
                    <option value="low_stock">{t("catalog.lowStock")}</option>
                    <option value="out_of_stock">{t("catalog.outOfStock")}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#65637D] pointer-events-none" />
                </div>
              </div>
            )}

            {/* Right side CTA actions */}
            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-[#E4E4F0] hover:bg-[#F7F7FB] text-xs font-bold text-[#151328] transition-colors cursor-pointer outline-none"
              >
                <Download className="h-4 w-4 text-[#65637D]" />
                {t("catalog.export")}
              </button>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsPanelOpen(true);
                }}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#FF6B5B] hover:bg-[#E5503F] text-xs font-bold text-white shadow-sm transition-colors cursor-pointer border-none outline-none select-none"
              >
                <Plus className="h-4 w-4" />
                {t("catalog.addProduct")}
              </button>
            </div>
          </div>

          {/* Table list view */}
          {loading && displayProducts.length === 0 ? (
            <div className="bg-white rounded-b-xl border border-[#E4E4F0] border-t-0 py-16 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          ) : (
            <ProductsTable
              products={displayProducts}
              total={total}
              limit={limit}
              offset={offset}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectRow={handleSelectRow}
              onEditRow={handleEditRow}
              onDuplicateRow={handleDuplicateRow}
              onDeleteRow={handleDeleteRow}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}

      {/* Add/Edit Product Panel */}
      <ProductPanel
        isOpen={isPanelOpen}
        product={editingProduct}
        onClose={() => {
          setIsPanelOpen(false);
          setEditingProduct(null);
        }}
      />
    </div>
  );
}
