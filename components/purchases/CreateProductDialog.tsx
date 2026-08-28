"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProductCreateInput } from "@/lib/types/imports";
import { fetchCategories, fetchUnits, fetchTaxRates, createCategory, createUnit, createTaxRate } from "@/lib/features/catalog/catalogSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreatableSelect } from "@/components/ui/creatable-select";
import { X } from "lucide-react";

interface CreateProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: ProductCreateInput) => void;
  initialName?: string;
  initialCostPrice?: number;
  existingProduct?: ProductCreateInput | null;
}

export function CreateProductDialog({
  isOpen,
  onClose,
  onSave,
  initialName = "",
  initialCostPrice = 0,
  existingProduct = null,
}: CreateProductDialogProps) {
  const dispatch = useAppDispatch();
  const { language } = useLanguage();
  const { categories, units, taxRates } = useAppSelector((state) => state.catalog);

  const handleCategoryCreate = async (name: string): Promise<string> => {
    const result = await dispatch(createCategory({ name })).unwrap();
    return result.id;
  };

  const handleTaxRateCreate = async (name: string): Promise<string> => {
    const guessedRate = parseInt(name.replace(/\D/g, "")) || 0;
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

  // Form states
  const [name, setName] = useState(existingProduct?.name || initialName);
  const [sku, setSku] = useState(existingProduct?.sku || "");
  const [barcode, setBarcode] = useState(existingProduct?.barcode || "");
  const [costPrice, setCostPrice] = useState<number | "">(existingProduct?.cost_price !== undefined ? existingProduct.cost_price : initialCostPrice);
  const [sellingPrice, setSellingPrice] = useState<number | "">(existingProduct?.selling_price !== undefined ? existingProduct.selling_price : 0);
  const [mrp, setMrp] = useState<number | undefined>(existingProduct?.mrp);
  const [categoryId, setCategoryId] = useState(existingProduct?.category_id || "");
  const [unitId, setUnitId] = useState(existingProduct?.unit_id || "");
  const [taxRateId, setTaxRateId] = useState(existingProduct?.tax_rate_id || "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch dropdowns if empty
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCategories());
      dispatch(fetchUnits());
      dispatch(fetchTaxRates());
    }
  }, [isOpen, dispatch]);

  // Auto-select category if there is only one
  useEffect(() => {
    if (isOpen && categories.length === 1 && !categoryId && !existingProduct?.category_id) {
      setCategoryId(categories[0].id);
    }
  }, [isOpen, categories, categoryId, existingProduct]);

  // Sync initial values when they change
  useEffect(() => {
    setName(initialName);
    setCostPrice(initialCostPrice);
    setSellingPrice(initialCostPrice); // Fallback estimate
    setErrors({});
  }, [initialName, initialCostPrice, isOpen]);

  if (!isOpen) return null;

  // Format dropdown options
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const unitOptions = units.map((u) => ({ value: u.id, label: `${u.name} (${u.symbol})` }));
  const taxRateOptions = taxRates.map((tr) => ({
    value: tr.id,
    label: `${tr.name} (${tr.rate}%)`,
  }));

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!name.trim()) {
      tempErrors.name = language === "hi" ? "उत्पाद का नाम आवश्यक है" : "Product name is required";
    }
    if (!unitId) {
      tempErrors.unitId = language === "hi" ? "माप की इकाई का चयन करें" : "Please select a unit";
    }
    if (costPrice !== "" && Number(costPrice) < 0) {
      tempErrors.costPrice = language === "hi" ? "लागत मूल्य 0 या अधिक होना चाहिए" : "Cost price must be 0 or more";
    }
    if (sellingPrice !== "" && Number(sellingPrice) < 0) {
      tempErrors.sellingPrice = language === "hi" ? "बिक्री मूल्य 0 या अधिक होना चाहिए" : "Selling price must be 0 or more";
    }
    if (mrp !== undefined && sellingPrice !== "" && mrp < Number(sellingPrice)) {
      tempErrors.mrp = language === "hi" ? "MRP बिक्री मूल्य से अधिक या बराबर होना चाहिए" : "MRP must be >= selling price";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || undefined,
      cost_price: costPrice === "" ? 0 : Number(costPrice),
      selling_price: sellingPrice === "" ? 0 : Number(sellingPrice),
      mrp: mrp ? Number(mrp) : undefined,
      category_id: categoryId || undefined,
      tax_rate_id: taxRateId || undefined,
      unit_id: unitId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#151328]/35 backdrop-blur-xs animate-in fade-in duration-200"
      />
      {/* Slide-over Container */}
      <div className="relative w-full max-w-[480px] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 font-sans">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E4E4F0] px-6 py-4 flex items-center justify-between shrink-0 z-20">
          <div>
            <h2 className="text-base font-extrabold text-[#151328]">
              {language === "hi" ? "नया उत्पाद जोड़ें / Add New Product" : "Add New Product"}
            </h2>
            <p className="text-[11px] text-[#65637D] font-medium mt-0.5">
              {language === "hi" 
                ? "उत्पाद विवरण भरें — यह कमिट करने पर जोड़ा जाएगा।" 
                : "Fill details — product will be created upon committing."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#65637D] hover:bg-[#F7F7FB] hover:text-[#151328] transition-colors cursor-pointer outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5" noValidate>
          <Input
            label={language === "hi" ? "उत्पाद का नाम * / Product Name *" : "Product Name *"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder={language === "hi" ? "उदा. अनिक मिल्क पाउडर" : "e.g. Anik Milk Powder"}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={language === "hi" ? "लागत मूल्य * (₹) / Cost Price * (₹)" : "Cost Price * (₹)"}
              type="number"
              step="any"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
              onWheel={(e) => e.currentTarget.blur()}
              error={errors.costPrice}
            />

            <Input
              label={language === "hi" ? "बिक्री मूल्य * (₹) / Selling Price * (₹)" : "Selling Price * (₹)"}
              type="number"
              step="any"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))}
              onWheel={(e) => e.currentTarget.blur()}
              error={errors.sellingPrice}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={language === "hi" ? "MRP (₹) / MRP (₹)" : "MRP (₹)"}
              type="number"
              step="any"
              value={mrp !== undefined ? mrp : ""}
              onChange={(e) => setMrp(e.target.value === "" ? undefined : Number(e.target.value))}
              onWheel={(e) => e.currentTarget.blur()}
              error={errors.mrp}
              placeholder="Optional"
            />

            <CreatableSelect
              label={language === "hi" ? "माप की इकाई * / Unit *" : "Unit *"}
              value={unitId}
              onChange={(val) => setUnitId(val || "")}
              options={unitOptions}
              placeholder={language === "hi" ? "इकाई चुनें" : "Select Unit"}
              onCreateOption={handleUnitCreate}
              createLabel={language === "hi" ? "इकाई जोड़ें / Add Unit" : "Add Unit"}
              error={errors.unitId}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={language === "hi" ? "एसकेयू / SKU" : "SKU"}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. ANIK-100G"
            />

            <Input
              label={language === "hi" ? "बारकोड / Barcode" : "Barcode"}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or type barcode"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CreatableSelect
              label={language === "hi" ? "श्रेणी / Category" : "Category"}
              value={categoryId}
              onChange={(val) => setCategoryId(val || "")}
              options={categoryOptions}
              placeholder={language === "hi" ? "श्रेणी चुनें" : "Select Category"}
              onCreateOption={handleCategoryCreate}
              createLabel={language === "hi" ? "श्रेणी जोड़ें / Add Category" : "Add Category"}
            />

            <CreatableSelect
              label={language === "hi" ? "टैक्स दर / Tax Rate" : "Tax Rate"}
              value={taxRateId}
              onChange={(val) => setTaxRateId(val || "")}
              options={taxRateOptions}
              placeholder={language === "hi" ? "टैक्स चुनें" : "Select Tax"}
              onCreateOption={handleTaxRateCreate}
              createLabel={language === "hi" ? "टैक्स जोड़ें / Add Tax Rate" : "Add Tax Rate"}
            />
          </div>

          {/* Action buttons footer */}
          <div className="border-t border-[#E4E4F0] pt-6 mt-8 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 py-5 text-xs font-bold border-[#E4E4F0] text-[#65637D] hover:bg-[#F7F7FB]"
            >
              {language === "hi" ? "रद्द करें / Cancel" : "Cancel"}
            </Button>
            <Button
              type="submit"
              className="flex-1 py-5 text-xs font-bold bg-[#4338CA] hover:bg-[#372f9f] text-white"
            >
              {language === "hi" ? "उत्पाद जोड़ें / Add Product" : "Add Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
