"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useGetTaxRatesQuery, useGetUnitsQuery } from "@/lib/features/catalog/catalogApi";
import { useCreateSaleMutation, useCreateCustomerMutation } from "@/lib/features/sales/salesApi";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { createApiClient } from "@/lib/apiClient";
import { store } from "@/lib/store";
import { AsyncSearchSelect, AsyncOption } from "@/components/ui/async-search-select";
import { X, Plus, Trash2, HelpCircle, Check, Sparkles, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CheckoutItem {
  id: string; // client-side temp id for key indexing
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate_id: string | null;
  tax_rate_percentage: number;
  current_stock: number;
  sku: string;
  unit_symbol: string;
}

export function CheckoutPanel({ isOpen, onClose }: CheckoutPanelProps) {
  const { t } = useLanguage();
  
  // RTK Query fetches
  const { data: taxRates = [] } = useGetTaxRatesQuery(undefined, { skip: !isOpen });
  const { data: units = [] } = useGetUnitsQuery(undefined, { skip: !isOpen });

  // RTK Query mutations
  const [createSale, { isLoading: isSaving }] = useCreateSaleMutation();
  const [createCustomer] = useCreateCustomerMutation();

  // Local state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState<string>("");
  const [items, setItems] = useState<CheckoutItem[]>([
    {
      id: "row-0",
      product_id: "",
      product_name: "",
      quantity: 1,
      unit_price: 0,
      tax_rate_id: null,
      tax_rate_percentage: 0,
      current_stock: 0,
      sku: "",
      unit_symbol: "",
    },
  ]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Customer quick add inline form state
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  // References for keyboard focus traversal between row fields
  const rowRefs = useRef<Record<string, {
    productInput: HTMLInputElement | null;
    qtyInput: HTMLInputElement | null;
    priceInput: HTMLInputElement | null;
  }>>({});
  const amountPaidRef = useRef<HTMLInputElement>(null);

  // Barcode scanner state buffers
  const scannerBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);

  // Fetch initial base details (customers, tax rates, base products list)
  useEffect(() => {
    if (isOpen) {
      // Reset state
      setSelectedCustomerId("");
      setSelectedCustomerLabel("");
      setItems([
        {
          id: `row-${Date.now()}`,
          product_id: "",
          product_name: "",
          quantity: 1,
          unit_price: 0,
          tax_rate_id: null,
          tax_rate_percentage: 0,
          current_stock: 0,
          sku: "",
          unit_symbol: "",
        },
      ]);
      setAmountPaid(0);
      amountPaidManualRef.current = false; // re-enable auto-sync for new checkout
      setErrorMessage(null);
      setIsAddingCustomer(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
    }
  }, [isOpen]);

  // Tax rates ID to percentage lookup mapping
  const taxRatesMap = React.useMemo(() => {
    const mapping: Record<string, number> = {};
    taxRates.forEach((tr) => {
      mapping[tr.id] = tr.rate;
    });
    return mapping;
  }, [taxRates]);

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  
  const taxTotal = items.reduce((acc, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    const taxAmt = itemSubtotal * (item.tax_rate_percentage / 100);
    return acc + taxAmt;
  }, 0);

  const grandTotal = subtotal + taxTotal;

  // Auto-sync amount paid to grand total whenever it changes (unless cashier manually overrode it)
  const amountPaidManualRef = useRef(false);
  useEffect(() => {
    if (!amountPaidManualRef.current) {
      setAmountPaid(Math.round(grandTotal * 100) / 100);
    }
  }, [grandTotal]);

  // Reset manual-override flag when panel opens
  // (already handled in the isOpen useEffect via setAmountPaid(0) → we also reset the flag)

  // Keyboard focus helpers
  const focusField = (rowId: string, field: "productInput" | "qtyInput" | "priceInput") => {
    setTimeout(() => {
      const rowRef = rowRefs.current[rowId];
      if (rowRef && rowRef[field]) {
        rowRef[field]?.focus();
        if (field === "qtyInput" || field === "priceInput") {
          rowRef[field]?.select();
        }
      }
    }, 50);
  };

  // Append new empty row and auto-focus its product combobox
  const handleAddNewRow = () => {
    const newId = `row-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        product_id: "",
        product_name: "",
        quantity: 1,
        unit_price: 0,
        tax_rate_id: null,
        tax_rate_percentage: 0,
        current_stock: 0,
        sku: "",
        unit_symbol: "",
      },
    ]);
    focusField(newId, "productInput");
  };

  // Remove row
  const handleRemoveRow = (rowId: string) => {
    if (items.length === 1) {
      // Keep at least one empty row
      setItems([
        {
          id: `row-${Date.now()}`,
          product_id: "",
          product_name: "",
          quantity: 1,
          unit_price: 0,
          tax_rate_id: null,
          tax_rate_percentage: 0,
          current_stock: 0,
          sku: "",
          unit_symbol: "",
        },
      ]);
      return;
    }
    
    // Find index of row being deleted to refocus neighboring row
    const deletedIdx = items.findIndex((item) => item.id === rowId);
    setItems((prev) => prev.filter((item) => item.id !== rowId));
    
    // Refocus previous row if possible, otherwise next row
    const targetIdx = deletedIdx > 0 ? deletedIdx - 1 : 0;
    setTimeout(() => {
      const remainingItems = items.filter((item) => item.id !== rowId);
      if (remainingItems[targetIdx]) {
        focusField(remainingItems[targetIdx].id, "productInput");
      }
    }, 50);
  };

  // AsyncSearchSelect adapter: search products for a given row
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

      const stockLabel = stock === 0 
        ? "Out of Stock" 
        : unitSymbol 
          ? `${stock} ${unitSymbol} left` 
          : `${stock} left`;

      const priceDisplay = unitSymbol 
        ? `₹${Number(prod.selling_price).toFixed(2)} / ${unitSymbol}` 
        : `₹${Number(prod.selling_price).toFixed(2)}`;

      return {
        value: prod.id,
        label: prod.name,
        sublabel: prod.sku ? `SKU: ${prod.sku}` : undefined,
        badge: `${priceDisplay}  •  ${stockLabel}`,
        meta: { ...prod, current_stock: stock, selling_price: Number(prod.selling_price), cost_price: Number(prod.cost_price) },
      } satisfies AsyncOption;
    });
  };

  // AsyncSearchSelect adapter: search customers
  const searchCustomers = async (query: string): Promise<AsyncOption[]> => {
    const client = createApiClient(store.getState);
    const url = query.trim()
      ? `${API_ENDPOINTS.backend.parties.base}?party_type=customer&search=${encodeURIComponent(query)}&limit=6`
      : `${API_ENDPOINTS.backend.parties.base}?party_type=customer&limit=6`;
    const response = await client.get<any>(url);
    const parties = response.items || (Array.isArray(response) ? response : []);
    return parties.map((p: any) => ({
      value: p.id,
      label: p.name,
      badge: p.phone || "",
      meta: p,
    } satisfies AsyncOption));
  };

  // Product Selection handler (called from AsyncSearchSelect onChange)
  const handleSelectProduct = (rowId: string, option: AsyncOption | null) => {
    if (!option) {
      // Cleared — reset this row
      setItems((prev) =>
        prev.map((item) =>
          item.id === rowId
            ? { ...item, product_id: "", product_name: "", unit_price: 0, tax_rate_id: null, tax_rate_percentage: 0, current_stock: 0, sku: "", unit_symbol: "" }
            : item
        )
      );
      return;
    }
    const prod = option.meta as any;
    const percentage = prod.tax_rate_id ? (taxRatesMap[prod.tax_rate_id] || 0) : 0;
    const matchedUnit = units.find((u) => u.id === prod.unit_id);
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              product_id: prod.id,
              product_name: prod.name,
              unit_price: Number(prod.selling_price),
              tax_rate_id: prod.tax_rate_id || null,
              tax_rate_percentage: percentage,
              current_stock: prod.current_stock,
              sku: prod.sku || "",
              unit_symbol: matchedUnit?.symbol || "",
            }
          : item
      )
    );
    // Autofocus quantity input
    focusField(rowId, "qtyInput");
  };

  // Quantity updates
  const handleQtyChange = (rowId: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === rowId ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  // Price updates
  const handlePriceChange = (rowId: string, price: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === rowId ? { ...item, unit_price: Math.max(0, price) } : item))
    );
  };

  // Barcode Lookup match helper
  const handleBarcodeScan = async (barcode: string) => {
    try {
      const client = createApiClient(store.getState);
      const response = await client.get<any>(
        `${API_ENDPOINTS.backend.catalog.products}?search=${encodeURIComponent(barcode)}&limit=1`
      );

      const rawProd = response.items?.[0];
      // Verify it's an exact barcode match
      if (rawProd && rawProd.barcode === barcode) {
        const batches = Array.isArray(rawProd.batches) ? rawProd.batches : [];
        const stock = batches.reduce((sum: number, b: any) => sum + Number(b.quantity || 0), 0);
        const matchedUnit = units.find((u) => u.id === rawProd.unit_id);

        const product = {
          ...rawProd,
          current_stock: stock,
          cost_price: Number(rawProd.cost_price),
          selling_price: Number(rawProd.selling_price),
        };

        // Check if product is already added in checkout list
        const existingIdx = items.findIndex((item) => item.product_id === product.id);

        if (existingIdx !== -1) {
          const existingItem = items[existingIdx];
          handleQtyChange(existingItem.id, existingItem.quantity + 1);
          focusField(existingItem.id, "qtyInput");
        } else {
          // Find if there is an empty/incomplete first row to reuse
          const emptyRowIdx = items.findIndex((item) => !item.product_id);
          const percentage = product.tax_rate_id ? (taxRatesMap[product.tax_rate_id] || 0) : 0;
          const targetRow = {
            product_id: product.id,
            product_name: product.name,
            unit_price: product.selling_price,
            tax_rate_id: product.tax_rate_id || null,
            tax_rate_percentage: percentage,
            current_stock: product.current_stock,
            sku: product.sku || "",
            unit_symbol: matchedUnit?.symbol || "",
          };

          if (emptyRowIdx !== -1) {
            const rowId = items[emptyRowIdx].id;
            setItems((prev) =>
              prev.map((item, idx) => (idx === emptyRowIdx ? { ...item, ...targetRow } : item))
            );
            focusField(rowId, "qtyInput");
          } else {
            // Append new scanned row
            const newId = `row-${Date.now()}`;
            setItems((prev) => [
              ...prev,
              {
                id: newId,
                quantity: 1,
                ...targetRow,
              },
            ]);
            focusField(newId, "qtyInput");
          }
        }
      } else {
        setErrorMessage(`Barcode "${barcode}" not found in store catalog`);
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch (err) {
      setErrorMessage("Failed to look up scanned barcode");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };


  // Global scanner and hotkeys hook
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Barcode scanner buffer capture
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;
      lastKeyTime.current = currentTime;

      // Hardware scanners type extremely fast (< 40ms per character)
      if (timeDiff < 40) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (scannerBuffer.current.length > 2) {
            handleBarcodeScan(scannerBuffer.current);
          }
          scannerBuffer.current = "";
          return;
        }
        if (e.key !== "Shift") {
          scannerBuffer.current += e.key;
        }
      } else {
        // Slow speed means human typing - clear scanner buffer
        scannerBuffer.current = e.key !== "Enter" && e.key !== "Shift" ? e.key : "";
      }

      // 2. Keyboard Hotkeys
      // Alt + A or Cmd + E -> Focus Amount Paid input
      if (e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        amountPaidRef.current?.focus();
        amountPaidRef.current?.select();
      }

      // Escape -> close panel (unless typing in customer add view)
      if (e.key === "Escape" && !isAddingCustomer) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, items, isAddingCustomer]);

  // Dynamic customer inline creation
  const handleQuickCustomerCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || newCustomerPhone.length !== 10) {
      setErrorMessage("Please enter a valid customer name and 10-digit phone number");
      return;
    }
    
    try {
      const result = await createCustomer({ name: newCustomerName, phone: newCustomerPhone }).unwrap();
      
      setSelectedCustomerId(result.id);
      setIsAddingCustomer(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err || "Failed to create customer");
    }
  };

  // Checkout submission handler
  const handleCheckoutSubmit = async () => {
    if (!selectedCustomerId) {
      setErrorMessage(t("sales.checkout.validation.selectCustomer"));
      return;
    }

    const checkoutItems = items.filter((item) => item.product_id);
    if (checkoutItems.length === 0) {
      setErrorMessage(t("sales.checkout.validation.minItems"));
      return;
    }

    // Check for stock shortages to highlight warning confirmation
    const stockShortages = checkoutItems.filter((i) => i.quantity > i.current_stock);
    if (stockShortages.length > 0) {
      const proceed = confirm("Warning: You are selling items that exceed current stock. Proceed anyway?");
      if (!proceed) return;
    }

    setErrorMessage(null);
    try {
      await createSale({
        party_id: selectedCustomerId,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_total: Math.round(taxTotal * 100) / 100,
        grand_total: Math.round(grandTotal * 100) / 100,
        amount_paid: Math.round(amountPaid * 100) / 100,
        items: checkoutItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate_id: item.tax_rate_id,
        })),
      }).unwrap();
      
      // Success! Close panel
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Transaction failed");
    }
  };

  // Global keydown listeners for F2 to open panel
  useEffect(() => {
    const handleF2Listener = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        onClose(); // triggers toggle if already active
      }
    };
    window.addEventListener("keydown", handleF2Listener);
    return () => window.removeEventListener("keydown", handleF2Listener);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Dark overlay backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Slide-over Panel Content */}
      <div className="relative w-full max-w-[700px] bg-white h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 transform translate-x-0 border-l border-[#E4E4F0]">
        
        {/* Sticky Header */}
        <div className="px-6 py-4.5 border-b border-[#E4E4F0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8.5 w-8.5 rounded-lg bg-[#EEF2FF] border border-[#C7C7E0] flex items-center justify-center text-brand">
              <Sparkles className="h-4.5 w-4.5 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#151328]">{t("sales.checkout.title")}</h2>
              <p className="text-[10px] font-semibold text-[#65637D] mt-0.5">
                Press <kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono text-[9px]">F2</kbd> to toggle panel • <kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono text-[9px]">Alt+A</kbd> focus cash
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F7F7FB] text-[#65637D] hover:text-[#151328] cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Validation Errors banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg flex items-center justify-between animate-bounce">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900 font-bold ml-2">×</button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Customer Selection Row */}
          <div className="bg-[#F8FAFC] p-4.5 rounded-xl border border-[#E2E8F0] space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                {t("sales.checkout.selectCustomer")} *
              </label>
              {!isAddingCustomer && (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomer(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-indigo-800 cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {t("sales.checkout.createCustomer")}
                </button>
              )}
            </div>

            {isAddingCustomer ? (
              /* Inline Add Customer subform */
              <form onSubmit={handleQuickCustomerCreate} className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-3.5 rounded-lg border border-indigo-100">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    required
                    placeholder={t("sales.checkout.customerName")}
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] placeholder-[#98A2B3] focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder={t("sales.checkout.phone")}
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-9 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] placeholder-[#98A2B3] focus:border-brand focus:ring-1 focus:ring-brand outline-none font-mono"
                  />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="h-9 flex-1 sm:w-full bg-brand hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomer(false)}
                    className="h-9 flex-1 sm:w-full bg-[#F1F5F9] hover:bg-slate-200 text-[#475569] rounded-lg flex items-center justify-center cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </form>
            ) : (
              /* Searchable Customer Combobox — powered by AsyncSearchSelect */
              <AsyncSearchSelect
                placeholder="Type customer name or mobile number..."
                value={selectedCustomerId || null}
                displayValue={selectedCustomerLabel}
                onSearch={searchCustomers}
                onChange={(opt) => {
                  if (opt) {
                    setSelectedCustomerId(opt.value);
                    setSelectedCustomerLabel(`${opt.label}${opt.badge ? ` (${opt.badge})` : ""}`);
                  } else {
                    setSelectedCustomerId("");
                    setSelectedCustomerLabel("");
                  }
                }}
              />
            )}
          </div>

          {/* Checkout Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E4E4F0] pb-2">
              <h3 className="text-xs font-bold text-[#151328] uppercase tracking-wider">Product Items</h3>
              <span className="text-[10px] font-semibold text-[#65637D]">Shift+Backspace deletes row</span>
            </div>

            {/* Invoices list rows */}
            <div className="space-y-2.5">
              {items.map((item, index) => {
                const isOutOfStock = item.product_id && item.quantity > item.current_stock;
                
                return (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-2.5 sm:items-start border-b border-[#F1F5F9] pb-3 sm:border-none sm:pb-0">
                    
                    {/* Top segment: Index + Product search + Mobile delete */}
                    <div className="flex gap-2.5 items-start w-full flex-1">
                      {/* Row index bubble */}
                      <div className="h-9 w-6.5 text-xs font-bold text-[#98A2B3] flex items-center justify-center mt-0.5 shrink-0">
                        {index + 1}
                      </div>

                      {/* Product Search Combobox — powered by AsyncSearchSelect */}
                      <div className="flex-1 min-w-0">
                        <AsyncSearchSelect
                          size="sm"
                          placeholder={t("sales.checkout.scanOrType")}
                          value={item.product_id || null}
                          displayValue={item.product_name}
                          onSearch={makeProductSearchFn(item.id)}
                          onChange={(opt) => handleSelectProduct(item.id, opt)}
                        />
                      </div>

                      {/* Delete Action button (Mobile) */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(item.id)}
                        className="sm:hidden h-9 w-9 shrink-0 flex items-center justify-center rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 text-[#98A2B3] hover:text-red-500 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Bottom segment: Qty + Price + Desktop delete */}
                    <div className="flex gap-2.5 items-center pl-9 sm:pl-0 w-full sm:w-auto shrink-0">
                      {/* Quantity Input */}
                      <div className="flex-1 sm:w-28 sm:shrink-0">
                        <div className={cn(
                          "flex items-center gap-1 bg-white border border-[#C7C7E0] rounded-lg px-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand",
                          isOutOfStock && "border-red-400 bg-red-50"
                        )}>
                          <input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            value={item.quantity}
                            ref={(el) => {
                              if (!rowRefs.current[item.id]) {
                                rowRefs.current[item.id] = { productInput: null, qtyInput: null, priceInput: null };
                              }
                              rowRefs.current[item.id].qtyInput = el;
                            }}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 1)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                focusField(item.id, "priceInput");
                              }
                            }}
                            className={cn(
                              "w-full h-9 text-center text-sm text-[#151328] placeholder-[#98A2B3] outline-none font-semibold font-mono border-0 p-0",
                              isOutOfStock && "text-red-700 bg-transparent"
                            )}
                          />
                          {item.unit_symbol && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 select-none bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                              {item.unit_symbol}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price Input */}
                      <div className="flex-1 sm:w-28 sm:shrink-0">
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-[11px] font-semibold text-[#65637D]">₹</span>
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            placeholder="Price"
                            value={item.unit_price}
                            ref={(el) => {
                              if (!rowRefs.current[item.id]) {
                                rowRefs.current[item.id] = { productInput: null, qtyInput: null, priceInput: null };
                              }
                              rowRefs.current[item.id].priceInput = el;
                            }}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "Tab") {
                                if (index === items.length - 1) {
                                  e.preventDefault();
                                  handleAddNewRow();
                                }
                              }
                            }}
                            className="w-full h-9 pl-6 pr-2 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] placeholder-[#98A2B3] focus:border-brand focus:ring-1 focus:ring-brand outline-none font-semibold font-mono"
                          />
                        </div>
                      </div>

                      {/* Delete Action button (Desktop) */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(item.id)}
                        className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 text-[#98A2B3] hover:text-red-500 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
            
            {/* Add Row button */}
            <button
              type="button"
              onClick={handleAddNewRow}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-indigo-800 cursor-pointer pt-1"
            >
              <Plus className="h-4 w-4" />
              Add Another Line Item
            </button>
          </div>

        </div>

        {/* Sticky Footer Summary & Finalization Card */}
        <div className="bg-[#F8FAFC] border-t border-[#E4E4F0] p-6 space-y-4 shrink-0">
          
          {/* Real-time Billing totals */}
          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-800">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Calculated Tax:</span>
                <span className="font-mono text-slate-800">₹{taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-800 pt-1.5 border-t border-slate-200">
                <span>{t("sales.grandTotal")}:</span>
                <span className="font-mono text-brand text-base">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Fields */}
            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {t("sales.checkout.amountPaid")} (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-[#65637D]">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={amountPaid || ""}
                    ref={amountPaidRef}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      amountPaidManualRef.current = true;
                      setAmountPaid(parseFloat(e.target.value) || 0);
                    }}
                    placeholder="0.00"
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] placeholder-[#98A2B3] focus:border-brand focus:ring-1 focus:ring-brand outline-none font-bold font-mono"
                  />
                </div>
              </div>
              
              {/* Balance indicator — only shown when cashier pays less than total */}
              {amountPaid < grandTotal - 0.005 && (
                <div className="flex justify-between text-[11px] font-semibold pt-1">
                  <span className="text-slate-500">Balance due:</span>
                  <span className="font-mono font-bold text-amber-600">
                    ₹{(grandTotal - amountPaid).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCheckoutSubmit}
              className="w-full h-11 bg-brand hover:bg-indigo-700 text-white text-sm font-bold rounded-lg cursor-pointer shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : t("sales.checkout.submit")}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
