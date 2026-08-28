"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useGetUnitsQuery, useCreateProductMutation } from "@/lib/features/catalog/catalogApi";
import { useCreateManualPurchaseMutation, useGetSuppliersQuery } from "@/lib/features/purchases/purchasesApi";
import { useCreatePartyMutation } from "@/lib/features/ledgers/ledgersApi";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { createApiClient } from "@/lib/apiClient";
import { store } from "@/lib/store";
import { AsyncSearchSelect, AsyncOption } from "@/components/ui/async-search-select";
import { CreateProductDialog } from "@/components/purchases/CreateProductDialog";
import { X, Plus, Trash2, Sparkles, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualPurchasePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PurchaseItem {
  id: string; // client-side temp id for key indexing
  product_id: string;
  product_name: string;
  quantity: number | "";
  unit_cost: number | "";
  selling_price: number | ""; // for display/reference
  batch_no: string;
  expiry_date: string;
  sku: string;
  unit_symbol: string;
}

export function ManualPurchasePanel({ isOpen, onClose, onSuccess }: ManualPurchasePanelProps) {
  const { language, t } = useLanguage();

  // RTK Query fetches
  const { data: units = [] } = useGetUnitsQuery(undefined, { skip: !isOpen });

  // RTK Query mutations
  const [createManualPurchase, { isLoading: isSaving }] = useCreateManualPurchaseMutation();
  const [createSupplier] = useCreatePartyMutation();
  const [createProduct] = useCreateProductMutation();

  // Local state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedSupplierLabel, setSelectedSupplierLabel] = useState<string>("");
  const [billNo, setBillNo] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      id: "row-0",
      product_id: "",
      product_name: "",
      quantity: "",
      unit_cost: "",
      selling_price: "",
      batch_no: "",
      expiry_date: "",
      sku: "",
      unit_symbol: "",
    },
  ]);

  // Supplier quick add inline form state
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");

  // Product quick create modal state
  const [activeRowForProductCreate, setActiveRowForProductCreate] = useState<string | null>(null);

  // References for keyboard focus traversal between row fields
  const rowRefs = useRef<Record<string, {
    productInput: HTMLInputElement | null;
    qtyInput: HTMLInputElement | null;
    costInput: HTMLInputElement | null;
  }>>({});

  // Reset state on panel open
  useEffect(() => {
    if (isOpen) {
      setSelectedSupplierId("");
      setSelectedSupplierLabel("");
      setBillNo("");
      setItems([
        {
          id: `row-${Date.now()}`,
          product_id: "",
          product_name: "",
          quantity: "",
          unit_cost: "",
          selling_price: "",
          batch_no: "",
          expiry_date: "",
          sku: "",
          unit_symbol: "",
        },
      ]);
      setAmountPaid(0);
      setErrorMessage(null);
      setIsAddingSupplier(false);
      setNewSupplierName("");
      setNewSupplierPhone("");
      setActiveRowForProductCreate(null);
    }
  }, [isOpen]);

  // Calculations
  const grandTotal = items.reduce((acc, item) => {
    const qty = item.quantity === "" ? 0 : Number(item.quantity);
    const cost = item.unit_cost === "" ? 0 : Number(item.unit_cost);
    return acc + (qty * cost);
  }, 0);

  // Auto-sync amount paid to grand total
  const amountPaidManualRef = useRef(false);
  useEffect(() => {
    if (!amountPaidManualRef.current) {
      setAmountPaid(Math.round(grandTotal * 100) / 100);
    }
  }, [grandTotal]);

  // Keyboard focus helper
  const focusField = (rowId: string, field: "productInput" | "qtyInput" | "costInput") => {
    setTimeout(() => {
      const rowRef = rowRefs.current[rowId];
      if (rowRef && rowRef[field]) {
        rowRef[field]?.focus();
        if (field === "qtyInput" || field === "costInput") {
          rowRef[field]?.select();
        }
      }
    }, 50);
  };

  // Append new empty row
  const handleAddNewRow = () => {
    const newId = `row-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        product_id: "",
        product_name: "",
        quantity: "",
        unit_cost: "",
        selling_price: "",
        batch_no: "",
        expiry_date: "",
        sku: "",
        unit_symbol: "",
      },
    ]);
    focusField(newId, "productInput");
  };

  // Remove row
  const handleRemoveRow = (rowId: string) => {
    if (items.length === 1) {
      setItems([
        {
          id: `row-${Date.now()}`,
          product_id: "",
          product_name: "",
          quantity: "",
          unit_cost: "",
          selling_price: "",
          batch_no: "",
          expiry_date: "",
          sku: "",
          unit_symbol: "",
        },
      ]);
      return;
    }

    const deletedIdx = items.findIndex((item) => item.id === rowId);
    setItems((prev) => prev.filter((item) => item.id !== rowId));

    const targetIdx = deletedIdx > 0 ? deletedIdx - 1 : 0;
    setTimeout(() => {
      const remainingItems = items.filter((item) => item.id !== rowId);
      if (remainingItems[targetIdx]) {
        focusField(remainingItems[targetIdx].id, "productInput");
      }
    }, 50);
  };

  // AsyncSearchSelect adapter: search products
  const makeProductSearchFn = (rowId: string) => async (query: string): Promise<AsyncOption[]> => {
    const client = createApiClient(store.getState);
    const url = query.trim()
      ? `${API_ENDPOINTS.backend.catalog.products}?search=${encodeURIComponent(query)}&limit=8`
      : `${API_ENDPOINTS.backend.catalog.products}?limit=8`;
    const response = await client.get<any>(url);
    return (response.items || []).map((prod: any) => {
      const batches = Array.isArray(prod.batches) ? prod.batches : [];
      const stock = batches.reduce((sum: number, b: any) => sum + Number(b.quantity || 0), 0);
      const matchedUnit = units.find((u) => u.id === prod.unit_id);
      const unitSymbol = prod.unit?.symbol || matchedUnit?.symbol || "";

      return {
        value: prod.id,
        label: prod.name,
        sublabel: prod.sku ? `SKU: ${prod.sku}` : undefined,
        badge: `CP: ₹${Number(prod.cost_price).toFixed(2)} • SP: ₹${Number(prod.selling_price).toFixed(2)} • Stock: ${stock} ${unitSymbol}`,
        meta: { ...prod, current_stock: stock, unit_symbol: unitSymbol },
      } satisfies AsyncOption;
    });
  };

  // AsyncSearchSelect adapter: search suppliers
  const searchSuppliers = async (query: string): Promise<AsyncOption[]> => {
    const client = createApiClient(store.getState);
    const url = query.trim()
      ? `${API_ENDPOINTS.backend.parties.base}?party_type=supplier&search=${encodeURIComponent(query)}&limit=6`
      : `${API_ENDPOINTS.backend.parties.base}?party_type=supplier&limit=6`;
    const response = await client.get<any>(url);
    const parties = response.items || (Array.isArray(response) ? response : []);
    return parties.map((p: any) => ({
      value: p.id,
      label: p.name,
      badge: p.phone || "",
      meta: p,
    } satisfies AsyncOption));
  };

  // Product Selection handler
  const handleSelectProduct = (rowId: string, option: AsyncOption | null) => {
    if (!option) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === rowId
            ? {
                ...item,
                product_id: "",
                product_name: "",
                unit_cost: "",
                selling_price: "",
                sku: "",
                unit_symbol: "",
              }
            : item
        )
      );
      return;
    }

    const prod = option.meta;
    if (!prod) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              product_id: prod.id,
              product_name: prod.name,
              unit_cost: Number(prod.cost_price) || "",
              selling_price: Number(prod.selling_price) || "",
              sku: prod.sku || "",
              unit_symbol: prod.unit_symbol || "",
            }
          : item
      )
    );

    focusField(rowId, "qtyInput");
  };

  // Value change handlers
  const handleQtyChange = (rowId: string, val: string) => {
    const parsed = val === "" ? "" : Number(val);
    setItems((prev) =>
      prev.map((item) => (item.id === rowId ? { ...item, quantity: parsed } : item))
    );
  };

  const handleCostChange = (rowId: string, val: string) => {
    const parsed = val === "" ? "" : Number(val);
    setItems((prev) =>
      prev.map((item) => (item.id === rowId ? { ...item, unit_cost: parsed } : item))
    );
  };

  const handleBatchChange = (rowId: string, batchNo: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === rowId ? { ...item, batch_no: batchNo } : item))
    );
  };

  const handleExpiryChange = (rowId: string, dateStr: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === rowId ? { ...item, expiry_date: dateStr } : item))
    );
  };

  // Quick Create Supplier Handler
  const handleQuickSupplierCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    try {
      const response = await createSupplier({
        name: newSupplierName,
        phone: newSupplierPhone.trim(),
        party_type: "supplier",
      }).unwrap();

      setSelectedSupplierId(response.id);
      setSelectedSupplierLabel(response.name);
      setIsAddingSupplier(false);
      setNewSupplierName("");
      setNewSupplierPhone("");
    } catch (err: any) {
      setErrorMessage(err?.data?.detail || err?.message || "Failed to create supplier");
    }
  };

  // Inline Product Creation Success
  const handleProductCreateSave = async (productInput: any) => {
    if (!activeRowForProductCreate) return;
    const rowId = activeRowForProductCreate;

    try {
      const response = await createProduct({
        name: productInput.name,
        sku: productInput.sku || undefined,
        barcode: productInput.barcode || undefined,
        category_id: productInput.category_id || null,
        unit_id: productInput.unit_id,
        tax_rate_id: productInput.tax_rate_id || null,
        cost_price: productInput.cost_price,
        selling_price: productInput.selling_price,
        mrp: productInput.mrp || null,
        opening_stock: 0,
        reorder_level: 5,
      }).unwrap();

      const matchedUnit = units.find((u) => u.id === response.unit_id);
      
      setItems((prev) =>
        prev.map((item) =>
          item.id === rowId
            ? {
                ...item,
                product_id: response.id,
                product_name: response.name,
                unit_cost: Number(response.cost_price) || "",
                selling_price: Number(response.selling_price) || "",
                sku: response.sku || "",
                unit_symbol: matchedUnit?.symbol || "",
              }
            : item
        )
      );

      setActiveRowForProductCreate(null);
      focusField(rowId, "qtyInput");
    } catch (err: any) {
      setErrorMessage(err?.data?.detail || err?.message || "Failed to create product");
    }
  };

  // Submit manual purchase payload to backend API
  const handleCheckoutSubmit = async () => {
    setErrorMessage(null);

    // Validations
    if (!selectedSupplierId) {
      setErrorMessage("Please select or create a Supplier");
      return;
    }

    const invalidRow = items.find((item) => !item.product_id);
    if (invalidRow) {
      setErrorMessage("One or more rows have no product selected");
      return;
    }

    const invalidQtyOrCost = items.find(
      (item) =>
        item.quantity === "" ||
        Number(item.quantity) <= 0 ||
        item.unit_cost === "" ||
        Number(item.unit_cost) < 0
    );
    if (invalidQtyOrCost) {
      setErrorMessage("Please enter valid quantities (> 0) and costs (>= 0)");
      return;
    }

    const itemsPayload = items.map((item) => ({
      product_id: item.product_id,
      quantity: Number(item.quantity),
      unit_cost: Number(item.unit_cost),
      batch_no: item.batch_no || undefined,
      expiry_date: item.expiry_date || undefined,
    }));

    try {
      await createManualPurchase({
        party_id: selectedSupplierId,
        bill_no: billNo || `MP-${Date.now().toString().slice(-6)}`,
        grand_total: Number(grandTotal),
        amount_paid: Number(amountPaid),
        items: itemsPayload,
      }).unwrap();

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Manual purchase failed:", err);
      setErrorMessage(err?.data?.detail || err?.message || "Failed to record manual purchase");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Dark overlay backdrop */}
      <div 
        className="absolute inset-0 bg-[#151328]/35 backdrop-blur-xs transition-opacity" 
        onClick={isSaving ? undefined : onClose} 
      />

      {/* Slide-over Panel Content */}
      <div className="relative w-full max-w-full sm:max-w-[760px] bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#E4E4F0] animate-in slide-in-from-right duration-350">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#E4E4F0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8.5 w-8.5 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-purple-600">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#151328]">Record Manual Purchase</h2>
              <p className="text-[10px] font-semibold text-[#65637D] mt-0.5">
                Replenish stock & record a purchase ledger entry manually
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSaving}
            className="p-1.5 rounded-lg hover:bg-[#F7F7FB] text-[#65637D] hover:text-[#151328] cursor-pointer disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900 font-bold ml-2">×</button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Supplier & Bill Info Group */}
          <div className="bg-[#F8FAFC] p-4.5 rounded-xl border border-[#E2E8F0] space-y-4">
            
            {/* Supplier Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                  Supplier *
                </label>
                {!isAddingSupplier && (
                  <button
                    type="button"
                    onClick={() => setIsAddingSupplier(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-indigo-800 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Create Supplier
                  </button>
                )}
              </div>

              {isAddingSupplier ? (
                /* Inline Add Supplier Form */
                <form onSubmit={handleQuickSupplierCreate} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 bg-white p-3 rounded-lg border border-purple-100">
                  <div className="col-span-12 sm:col-span-6">
                    <input
                      type="text"
                      required
                      placeholder="Supplier Name *"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none placeholder-[#98A2B3] focus:border-brand focus:ring-1 focus:ring-brand font-semibold"
                    />
                  </div>
                  <div className="col-span-8 sm:col-span-4">
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="Phone"
                      value={newSupplierPhone}
                      onChange={(e) => setNewSupplierPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-9 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none placeholder-[#98A2B3] focus:border-brand focus:ring-1 focus:ring-brand font-mono font-semibold"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 flex gap-1.5">
                    <button
                      type="submit"
                      className="h-9 flex-1 bg-brand hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center cursor-pointer font-bold text-sm shadow-xs"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingSupplier(false)}
                      className="h-9 flex-1 bg-slate-100 hover:bg-slate-200 text-[#475569] rounded-lg flex items-center justify-center cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <AsyncSearchSelect
                  placeholder="Search supplier name or phone..."
                  value={selectedSupplierId || null}
                  displayValue={selectedSupplierLabel}
                  onChange={(opt) => {
                    setSelectedSupplierId(opt?.value || "");
                    setSelectedSupplierLabel(opt?.label || "");
                  }}
                  onSearch={searchSuppliers}
                />
              )}
            </div>

            {/* Bill Info */}
            <div className="grid grid-cols-2 gap-4 border-t border-[#E2E8F0] pt-3">
              <div>
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
                  Bill / Invoice No
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-10928 (optional)"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-[#C7C7E0] bg-white text-sm text-[#151328] outline-none placeholder-[#98A2B3] focus:border-brand focus:ring-1 focus:ring-brand font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full h-10 px-3.5 rounded-lg border border-[#C7C7E0] bg-white text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-semibold font-mono"
                />
              </div>
            </div>

          </div>

          {/* Items Header & Grid list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E4E4F0] pb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#65637D]">
                Purchase Items
              </span>
              <button
                type="button"
                onClick={handleAddNewRow}
                className="text-xs font-bold text-brand hover:text-indigo-850 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.id} className="relative p-4.5 rounded-xl border border-[#E4E4F0] bg-white hover:border-[#C7C7E0] transition-colors space-y-3.5">
                  
                  {/* Product Autocomplete Picker & Delete button */}
                  <div className="flex gap-3.5 items-end">
                    <div className="flex-1 min-w-0">
                      <AsyncSearchSelect
                        label={`Item #${idx + 1}`}
                        placeholder="Search product by name, SKU, or barcode..."
                        value={item.product_id || null}
                        displayValue={item.product_name}
                        onChange={(opt) => handleSelectProduct(item.id, opt)}
                        onSearch={makeProductSearchFn(item.id)}
                        onCreateOption={async (val) => {
                          setActiveRowForProductCreate(item.id);
                          return undefined; // Handled via modal hook
                        }}
                        createLabel="Quick Create Product"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(item.id)}
                      className="p-2 h-10 rounded-lg hover:bg-red-50 text-[#65637D] hover:text-red-600 transition-colors cursor-pointer border border-transparent hover:border-red-100 shrink-0"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Quantity, Cost, Expiry inputs */}
                  <div className="grid grid-cols-12 gap-3">
                    
                    {/* Quantity */}
                    <div className="col-span-6 sm:col-span-3">
                      <label className="text-[10px] font-bold text-[#65637D] block mb-1">
                        Qty {item.unit_symbol ? `(${item.unit_symbol})` : ""} *
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={item.quantity}
                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono font-semibold tabular-nums text-right"
                      />
                    </div>

                    {/* Cost price */}
                    <div className="col-span-6 sm:col-span-3">
                      <label className="text-[10px] font-bold text-[#65637D] block mb-1">
                        Unit Cost (₹) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={item.unit_cost}
                        onChange={(e) => handleCostChange(item.id, e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono font-semibold tabular-nums text-right"
                      />
                    </div>

                    {/* Batch Number */}
                    <div className="col-span-6 sm:col-span-3">
                      <label className="text-[10px] font-bold text-[#65637D] block mb-1">
                        Batch No
                      </label>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={item.batch_no}
                        onChange={(e) => handleBatchChange(item.id, e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-semibold"
                      />
                    </div>

                    {/* Expiry Date */}
                    <div className="col-span-6 sm:col-span-3">
                      <label className="text-[10px] font-bold text-[#65637D] block mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) => handleExpiryChange(item.id, e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono font-semibold"
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Footer Summary & Action triggers */}
        <div className="sticky bottom-0 bg-[#F7F7FB] border-t border-[#E4E4F0] p-4.5 sm:p-6 shrink-0 space-y-4">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm font-semibold text-[#151328]">
            <div className="bg-white p-3 rounded-lg border border-[#E4E4F0] shadow-2xs flex items-center justify-between">
              <span className="text-xs text-[#65637D] font-bold">GRAND TOTAL:</span>
              <span className="text-base font-extrabold text-[#151328] tabular-nums">
                ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#E4E4F0] shadow-2xs flex items-center justify-between gap-2">
              <span className="text-xs text-[#65637D] font-bold shrink-0">AMOUNT PAID:</span>
              <input
                type="number"
                step="any"
                value={amountPaid === 0 ? "" : amountPaid}
                onChange={(e) => {
                  amountPaidManualRef.current = true;
                  setAmountPaid(e.target.value === "" ? 0 : Number(e.target.value));
                }}
                className="w-full h-8 px-2 bg-[#F8FAFC] border border-[#C7C7E0] rounded text-sm text-[#151328] font-mono font-bold text-right outline-none focus:border-brand tabular-nums focus:bg-white"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="h-11 flex-1 bg-white border border-[#E4E4F0] text-[#65637D] font-bold rounded-lg text-sm cursor-pointer hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCheckoutSubmit}
              disabled={isSaving || items.length === 0}
              className="h-11 flex-[2] bg-brand text-white font-bold rounded-lg text-sm cursor-pointer hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {isSaving ? "Saving Purchase..." : "Record Purchase"}
            </button>
          </div>
        </div>

      </div>

      {/* QUICK PRODUCT CREATE DIALOG IF TRIGGERED */}
      {activeRowForProductCreate && (
        <CreateProductDialog
          isOpen={activeRowForProductCreate !== null}
          onClose={() => setActiveRowForProductCreate(null)}
          onSave={handleProductCreateSave}
        />
      )}

    </div>
  );
}
