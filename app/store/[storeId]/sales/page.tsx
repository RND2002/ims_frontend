"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fetchSales, fetchCustomers } from "@/lib/features/sales/salesSlice";
import { DataTable } from "@/components/ui/data-table";
import { CheckoutPanel } from "@/components/sales/CheckoutPanel";
import { ColumnDef } from "@tanstack/react-table";
import { Sale } from "@/lib/types/sales";
import { Search, Sparkles, ShoppingBag, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SalesPage() {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();

  // Redux state
  const sales = useAppSelector((state) => state.sales.sales);
  const total = useAppSelector((state) => state.sales.total);
  const limit = useAppSelector((state) => state.sales.limit);
  const offset = useAppSelector((state) => state.sales.offset);
  const loading = useAppSelector((state) => state.sales.loading);
  const customers = useAppSelector((state) => state.sales.customers);

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Debounce search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch sales and customers on mount and when query/status changes
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchSales({ limit, offset, search: debouncedSearchQuery, status: statusFilter }));
  }, [dispatch, limit, offset, debouncedSearchQuery, statusFilter]);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle Status Filter Change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // Handle Page Change
  const handlePageChange = (newOffset: number) => {
    dispatch(fetchSales({ limit, offset: newOffset, search: debouncedSearchQuery, status: statusFilter }));
  };

  // Keyboard shortcut listener to open Checkout Panel (F2)
  useEffect(() => {
    const handleF2KeyPress = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setIsCheckoutOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleF2KeyPress);
    return () => window.removeEventListener("keydown", handleF2KeyPress);
  }, []);

  // Columns definition for reusable DataTable
  const columns: ColumnDef<Sale>[] = [
    {
      id: "actions",
      header: "View",
      meta: { align: "text-center" },
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedSale(row.original)}
          className="h-8.5 w-8.5 rounded-lg border border-[#E4E4F0] bg-white text-[#65637D] hover:text-[#4338CA] hover:bg-[#F7F7FB] flex items-center justify-center transition-all cursor-pointer outline-none mx-auto"
          title="View Invoice"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
    {
      accessorKey: "invoice_no",
      header: t("sales.invoiceNo"),
      cell: ({ row }) => (
        <span
          className="font-bold text-brand hover:underline cursor-pointer"
          onClick={() => setSelectedSale(row.original)}
        >
          {row.original.invoice_no}
        </span>
      ),
    },
    {
      accessorKey: "party_id",
      header: t("sales.customer"),
      cell: ({ row }) => {
        const party = customers.find((c) => c.id === row.original.party_id);
        return <span>{party ? party.name : "Walk-in Customer"}</span>;
      },
    },
    {
      accessorKey: "created_at",
      header: t("sales.date"),
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return <span className="font-mono text-slate-500">{date.toLocaleDateString("en-IN")}</span>;
      },
    },
    {
      accessorKey: "grand_total",
      header: t("sales.grandTotal"),
      meta: { align: "text-right" },
      cell: ({ row }) => (
        <span className="font-bold font-mono">₹{row.original.grand_total.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "amount_paid",
      header: t("sales.amountPaid"),
      meta: { align: "text-right" },
      cell: ({ row }) => (
        <span className="font-bold font-mono text-slate-700">₹{row.original.amount_paid.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "payment_status",
      header: t("sales.status"),
      cell: ({ row }) => {
        const status = row.original.payment_status;
        let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
        if (status === "partial") badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";
        if (status === "unpaid") badgeStyle = "bg-red-50 text-red-700 border-red-100";
        const label = status === "paid" ? "Paid" : status === "partial" ? "Partial" : status === "unpaid" ? "Unpaid" : status ?? "—";
        return (
          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border tracking-wider", badgeStyle)}>
            {label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col h-full font-sans select-none w-full min-w-0">
      
      {/* Top Banner Toolbar */}
      <div className="bg-white px-6 py-4.5 rounded-t-xl border border-[#E4E4F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#151328] flex items-center gap-2">
            {t("sales.title")}
          </h1>
          <p className="text-xs font-semibold text-[#65637D] mt-0.5">
            {t("sales.subtitle").replace("{total}", String(total))}
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full md:w-auto">
          
          {/* Search bar */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]" />
            <input
              type="text"
              placeholder={t("sales.searchPlaceholder")}
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-10 pl-9 pr-4 w-full rounded-lg border border-[#C7C7E0] text-sm text-[#151328] placeholder-[#98A2B3] focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] outline-none bg-[#F7F7FB]"
            />
          </div>

          {/* Action and Filter Row */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Status filters */}
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="flex-1 sm:flex-none h-10 px-3 rounded-lg border border-[#C7C7E0] text-xs font-bold text-[#65637D] focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] outline-none bg-white cursor-pointer"
            >
              <option value="">{t("sales.allStatus")}</option>
              <option value="paid">{t("sales.paid")}</option>
              <option value="partial">{t("sales.partial")}</option>
              <option value="unpaid">{t("sales.unpaid")}</option>
            </select>

            {/* Add Sale CTA */}
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="flex-1 sm:flex-none h-10 px-4 bg-[#FF6B5B] hover:bg-[#E05344] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-[#FF6B5B]/20 transition-all active:scale-[0.98] border-none outline-none select-none"
            >
              <ShoppingBag className="h-4 w-4" />
              {t("sales.recordSale")}
            </button>
          </div>
        </div>
      </div>

      {/* Reusable DataTable Grid */}
      <DataTable
        columns={columns}
        data={sales}
        loading={loading}
        total={total}
        limit={limit}
        offset={offset}
        onPageChange={handlePageChange}
        showingText={t("sales.showing")}
      />

      {/* POS Checkout Panel */}
      <CheckoutPanel isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />

      {/* Sale Details Read-only Side Drawer */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setSelectedSale(null)} />
          <div className="relative w-full max-w-[480px] bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#E4E4F0]">
            
            {/* Drawer Header */}
            <div className="px-6 py-4.5 border-b border-[#E4E4F0] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sale Transaction Invoice</span>
                <h3 className="text-base font-bold text-[#151328] mt-0.5">{selectedSale.invoice_no}</h3>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1.5 rounded-lg hover:bg-[#F7F7FB] text-[#65637D] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Details Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Customer and metadata summary */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Customer Name:</span>
                  <span className="font-bold text-slate-800">
                    {customers.find((c) => c.id === selectedSale.party_id)?.name || "Walk-in Customer"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Transaction Date:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {new Date(selectedSale.created_at).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Checked out items list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#151328] uppercase tracking-wider border-b pb-2">Line Items</h4>
                <div className="divide-y divide-[#E4E4F0]">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold block text-slate-800">
                          {item.product_name || `Item #${idx + 1}`}
                        </span>
                        <span className="text-slate-400 block mt-0.5">
                          Qty: {Number(item.quantity)} × ₹{Number(item.unit_price).toFixed(2)}
                          {item.tax_rate !== undefined && (
                            <span className="ml-1.5 text-[9px] bg-slate-100 px-1 py-0.5 rounded font-mono">
                              Tax {item.tax_rate}%
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="font-bold font-mono text-slate-800">
                        ₹{Number(item.line_total ?? 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Invoice Total Summary */}
            <div className="bg-[#F8FAFC] border-t border-[#E4E4F0] p-6 space-y-2.5 text-xs">
              <div className="flex justify-between font-semibold text-slate-500">
                <span>Grand Total:</span>
                <span className="font-bold font-mono text-slate-800">₹{selectedSale.grand_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-500">
                <span>Amount Paid:</span>
                <span className="font-bold font-mono text-slate-800">₹{selectedSale.amount_paid.toFixed(2)}</span>
              </div>
              {Math.max(0, selectedSale.grand_total - selectedSale.amount_paid) > 0.005 && (
                <div className="flex justify-between font-bold text-sm text-amber-700 pt-2 border-t border-slate-200">
                  <span>Balance Due:</span>
                  <span className="font-mono">
                    ₹{Math.max(0, selectedSale.grand_total - selectedSale.amount_paid).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
