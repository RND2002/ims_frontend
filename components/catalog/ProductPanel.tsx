"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Product } from "@/lib/types/catalog";
import { productSchema, ProductFormData } from "@/lib/schemas/catalog";
import { createCategory, createTaxRate, createUnit, createProduct, updateProduct } from "@/lib/features/catalog/catalogSlice";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CreatableSelect } from "@/components/ui/creatable-select";
import { X, Scan, History, Layers3 } from "lucide-react";

interface ProductPanelProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null; // Null for Add mode, Product object for Edit mode
}

type TabType = "details" | "history" | "batches";

export function ProductPanel({ isOpen, onClose, product }: ProductPanelProps) {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { categories, units, taxRates, saving } = useAppSelector((state) => state.catalog);

  const [activeTab, setActiveTab] = useState<TabType>("details");

  // Format options for select dropdowns
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const taxRateOptions = taxRates.map((tr) => ({
    value: tr.id,
    label: `${tr.name} (${tr.rate}%)`,
  }));
  const unitOptions = units.map((u) => ({ value: u.id, label: `${u.name} (${u.symbol})` }));

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      category_id: "",
      unit_id: "",
      tax_rate_id: "",
      cost_price: 0,
      selling_price: 0,
      mrp: null,
      reorder_level: 5,
      opening_stock: 0,
    },
  });

  // Re-fill form values when product props change or modal resets
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku || "",
        barcode: product.barcode || "",
        category_id: product.category_id || "",
        unit_id: product.unit_id || "",
        tax_rate_id: product.tax_rate_id || "",
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        mrp: product.mrp || null,
        reorder_level: product.reorder_level,
        opening_stock: 0, // Not editable in edit mode
      });
      setActiveTab("details");
    } else {
      reset({
        name: "",
        sku: "",
        barcode: "",
        category_id: "",
        unit_id: "",
        tax_rate_id: "",
        cost_price: 0,
        selling_price: 0,
        mrp: null,
        reorder_level: 5,
        opening_stock: 0,
      });
      setActiveTab("details");
    }
  }, [product, reset, isOpen]);

  if (!isOpen) return null;

  const handleCategoryCreate = async (name: string): Promise<string> => {
    const result = await dispatch(createCategory({ name })).unwrap();
    return result.id;
  };

  const handleTaxRateCreate = async (name: string): Promise<string> => {
    // Guess rate percentage from text (e.g. GST 18% -> 18)
    const guessedRate = parseInt(name.replace(/\D/g, "")) || 0;
    
    // Normalize name to be at least 2 characters (e.g. "5" -> "GST 5%")
    let formattedName = name.trim();
    if (formattedName.length < 2) {
      formattedName = `GST ${formattedName}%`;
    } else if (!formattedName.includes("%") && /^\d+$/.test(formattedName)) {
      formattedName = `${formattedName}%`;
    }

    const result = await dispatch(createTaxRate({ name: formattedName, rate: guessedRate })).unwrap();
    return result.id;
  };

  const handleUnitCreate = async (name: string): Promise<string> => {
    const symbol = name.toLowerCase();
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    const result = await dispatch(createUnit({ name: formattedName, symbol })).unwrap();
    return result.id;
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (product) {
        // Edit mode
        await dispatch(
          updateProduct({
            id: product.id,
            name: data.name,
            sku: data.sku || undefined,
            barcode: data.barcode || null,
            category_id: data.category_id || null,
            unit_id: data.unit_id || null,
            tax_rate_id: data.tax_rate_id || null,
            cost_price: data.cost_price,
            selling_price: data.selling_price,
            mrp: data.mrp || null,
            reorder_level: data.reorder_level,
          })
        ).unwrap();
      } else {
        // Add mode
        await dispatch(
          createProduct({
            name: data.name,
            sku: data.sku || undefined,
            barcode: data.barcode || undefined,
            category_id: data.category_id || null,
            unit_id: data.unit_id || null,
            tax_rate_id: data.tax_rate_id || null,
            cost_price: data.cost_price,
            selling_price: data.selling_price,
            mrp: data.mrp || null,
            reorder_level: data.reorder_level,
            opening_stock: data.opening_stock,
          })
        ).unwrap();
      }
      onClose();
    } catch (err) {
      console.error("Save product thunk failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Dark Overlay Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#151328]/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
      />

      {/* Slide-over Content Container */}
      <div className="relative w-full max-w-[480px] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Header (Sticky top) */}
        <div className="sticky top-0 bg-white border-b border-[#E4E4F0] px-6 py-4 flex items-center justify-between shrink-0 z-20">
          <div>
            <h2 className="text-lg font-extrabold text-[#151328]">
              {product ? t("catalog.edit") : t("catalog.addProduct")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#65637D] hover:bg-[#F7F7FB] hover:text-[#151328] transition-colors cursor-pointer outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Tab Selector for Edit Mode */}
        {product && (
          <div className="flex bg-[#F7F7FB] px-6 border-b border-[#E4E4F0] shrink-0 select-none">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-3 px-1 text-xs font-bold transition-all border-b-2 mr-6 outline-none cursor-pointer ${
                activeTab === "details"
                  ? "border-[#4338CA] text-[#4338CA]"
                  : "border-transparent text-[#65637D] hover:text-[#151328]"
              }`}
            >
              {t("catalog.details")}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-3 px-1 text-xs font-bold transition-all border-b-2 mr-6 outline-none cursor-pointer ${
                activeTab === "history"
                  ? "border-[#4338CA] text-[#4338CA]"
                  : "border-transparent text-[#65637D] hover:text-[#151328]"
              }`}
            >
              {t("catalog.stockHistory")}
            </button>
            <button
              onClick={() => setActiveTab("batches")}
              className={`py-3 px-1 text-xs font-bold transition-all border-b-2 outline-none cursor-pointer ${
                activeTab === "batches"
                  ? "border-[#4338CA] text-[#4338CA]"
                  : "border-transparent text-[#65637D] hover:text-[#151328]"
              }`}
            >
              {t("catalog.batches")}
            </button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "details" && (
            <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              
              {/* Group 1: Basic Information */}
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#65637D] block border-b border-[#E4E4F0] pb-1">
                  {t("catalog.basicInfo")}
                </span>
                
                <Input
                  label={t("catalog.prodName")}
                  placeholder={t("catalog.prodNamePlaceholder")}
                  error={errors.name?.message}
                  {...register("name")}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("catalog.sku")}
                    placeholder={t("catalog.skuPlaceholder")}
                    error={errors.sku?.message}
                    {...register("sku")}
                  />

                  <div className="relative">
                    <Input
                      label={t("catalog.barcode")}
                      placeholder={t("catalog.barcodePlaceholder")}
                      error={errors.barcode?.message}
                      {...register("barcode")}
                      className="pr-9"
                    />
                    <Scan className="absolute right-3 bottom-3 h-4 w-4 text-[#65637D] pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="category_id"
                    control={control}
                    render={({ field }) => (
                      <CreatableSelect
                        label={t("catalog.category")}
                        placeholder={t("catalog.categoryPlaceholder")}
                        options={categoryOptions}
                        value={field.value}
                        onChange={field.onChange}
                        onCreateOption={handleCategoryCreate}
                        createLabel={t("catalog.createCategoryTitle")}
                        error={errors.category_id?.message}
                      />
                    )}
                  />

                  <Controller
                    name="tax_rate_id"
                    control={control}
                    render={({ field }) => (
                      <CreatableSelect
                        label={t("catalog.taxRate")}
                        placeholder={t("catalog.taxRatePlaceholder")}
                        options={taxRateOptions}
                        value={field.value}
                        onChange={field.onChange}
                        onCreateOption={handleTaxRateCreate}
                        createLabel={t("catalog.createTaxTitle")}
                        error={errors.tax_rate_id?.message}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Group 2: Pricing */}
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#65637D] block border-b border-[#E4E4F0] pb-1">
                  {t("catalog.pricing")}
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      label={t("catalog.costPrice")}
                      type="text"
                      inputMode="decimal"
                      error={errors.cost_price?.message}
                      {...register("cost_price", { valueAsNumber: true })}
                      className="pl-7"
                    />
                    <span className="absolute left-3 bottom-2.5 text-sm font-semibold text-[#65637D] select-none">
                      ₹
                    </span>
                  </div>

                  <div className="relative">
                    <Input
                      label={t("catalog.sellingPrice")}
                      type="text"
                      inputMode="decimal"
                      error={errors.selling_price?.message}
                      {...register("selling_price", { valueAsNumber: true })}
                      className="pl-7"
                    />
                    <span className="absolute left-3 bottom-2.5 text-sm font-semibold text-[#65637D] select-none">
                      ₹
                    </span>
                  </div>
                </div>

                <div className="relative w-1/2">
                  <Input
                    label={t("catalog.mrp")}
                    type="text"
                    inputMode="decimal"
                    error={errors.mrp?.message}
                    {...register("mrp", { valueAsNumber: true })}
                    className="pl-7"
                  />
                  <span className="absolute left-3 bottom-2.5 text-sm font-semibold text-[#65637D] select-none">
                    ₹
                  </span>
                </div>
              </div>

              {/* Group 3: Inventory */}
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#65637D] block border-b border-[#E4E4F0] pb-1">
                  {t("catalog.inventory")}
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name="unit_id"
                    render={({ field }) => (
                      <CreatableSelect
                        label={t("catalog.unit")}
                        placeholder={t("catalog.unitPlaceholder")}
                        options={unitOptions}
                        value={field.value || ""}
                        onChange={field.onChange}
                        error={errors.unit_id?.message}
                        onCreateOption={handleUnitCreate}
                        createLabel={t("catalog.createUnitTitle")}
                      />
                    )}
                  />

                  <Input
                    label={t("catalog.reorderLevel")}
                    type="number"
                    error={errors.reorder_level?.message}
                    {...register("reorder_level", { valueAsNumber: true })}
                  />
                </div>
                <p className="text-[10px] text-[#65637D] font-medium leading-none mt-1">
                  {t("catalog.reorderLevelDesc")}
                </p>

                {!product && (
                  <div className="pt-2">
                    <Input
                      label={t("catalog.openingStock")}
                      type="number"
                      error={errors.opening_stock?.message}
                      {...register("opening_stock", { valueAsNumber: true })}
                    />
                    <p className="text-[10px] text-[#65637D] font-medium leading-none mt-1.5">
                      {t("catalog.openingStockDesc")}
                    </p>
                  </div>
                )}
              </div>
            </form>
          )}

          {activeTab === "history" && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 font-sans">
              <History className="h-10 w-10 text-[#C7C7E0] mb-2" />
              <p className="text-xs font-bold text-[#151328]">No stock adjustments yet</p>
              <p className="text-[10px] text-[#65637D] max-w-[200px] mt-0.5">
                Adjustments will list here once stock ledger is active.
              </p>
            </div>
          )}

          {activeTab === "batches" && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 font-sans">
              <Layers3 className="h-10 w-10 text-[#C7C7E0] mb-2" />
              <p className="text-xs font-bold text-[#151328]">Default Batch</p>
              <p className="text-[10px] text-[#65637D] max-w-[240px] mt-0.5">
                Current total stock quantity is {product?.current_stock} units.
              </p>
            </div>
          )}
        </div>

        {/* Footer (Sticky bottom) */}
        {activeTab === "details" && (
          <div className="sticky bottom-0 bg-white border-t border-[#E4E4F0] px-6 py-4 flex items-center justify-end shrink-0 z-20">
            <Button
              type="submit"
              form="product-form"
              disabled={saving}
              variant="cta"
              size="md"
              className="bg-[#FF6B5B] hover:bg-[#E5503F] text-white border-none rounded-lg font-bold px-6 cursor-pointer"
            >
              {saving ? "Saving..." : t("catalog.saveProduct")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
