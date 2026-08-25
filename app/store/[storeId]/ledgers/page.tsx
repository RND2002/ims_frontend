"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { DataTable } from "@/components/ui/data-table";
import { createApiClient } from "@/lib/apiClient";
import { store } from "@/lib/store";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { ColumnDef } from "@tanstack/react-table";
import { Party, LedgerEntry, LedgerStatement } from "@/lib/types/sales";
import { Search, UserPlus, IndianRupee, ArrowDownLeft, ArrowUpRight, BookOpen, X, Loader2, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddContactDialog } from "@/components/ledgers/AddContactDialog";
import { RecordPaymentDialog } from "@/components/ledgers/RecordPaymentDialog";

export default function LedgersPage() {
  const { t } = useLanguage();
  
  // Local page state
  const [activeTab, setActiveTab] = useState<"customer" | "supplier">("customer");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [parties, setParties] = useState<Party[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Add Contact Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Statement Drawer State
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [statement, setStatement] = useState<LedgerStatement | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  // Record Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setOffset(0); // reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load parties list
  const loadParties = async () => {
    setLoading(true);
    try {
      const client = createApiClient(store.getState);
      const queryParams = new URLSearchParams({
        party_type: activeTab,
        limit: String(limit),
        offset: String(offset),
      });
      if (debouncedSearchQuery.trim()) {
        queryParams.append("search", debouncedSearchQuery.trim());
      }
      const data = await client.get<any>(`${API_ENDPOINTS.backend.parties.base}?${queryParams.toString()}`);
      
      const items = (data.items || []).map((p: any) => ({
        ...p,
        opening_balance: p.opening_balance ? Number(p.opening_balance) : 0,
        current_balance: p.current_balance ? Number(p.current_balance) : 0,
      }));
      setParties(items);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, [activeTab, debouncedSearchQuery, offset, limit]);

  // Load statement details
  const loadStatement = async (partyId: string) => {
    setStatementLoading(true);
    try {
      const client = createApiClient(store.getState);
      const data = await client.get<any>(API_ENDPOINTS.backend.ledger.statement(partyId));
      setStatement({
        ...data,
        current_balance: data.current_balance ? Number(data.current_balance) : 0,
        entries: Array.isArray(data.entries)
          ? data.entries.map((e: any) => ({
              ...e,
              amount: e.amount ? Number(e.amount) : 0,
              balance_after: e.balance_after ? Number(e.balance_after) : 0,
            }))
          : [],
      });
    } catch (err) {
      console.error("Failed to load ledger statements:", err);
    } finally {
      setStatementLoading(false);
    }
  };

  // Trigger statement drawer opening
  const handleOpenStatement = (party: Party) => {
    setSelectedParty(party);
    loadStatement(party.id);
  };

  // Aggregate outstanding balance summaries
  const theyOweTotal = parties
    .filter((p) => (activeTab === "customer" && p.current_balance > 0) || (activeTab === "supplier" && p.current_balance > 0))
    .reduce((sum, p) => sum + p.current_balance, 0);

  const weOweTotal = parties
    .filter((p) => (activeTab === "customer" && p.current_balance < 0) || (activeTab === "supplier" && p.current_balance < 0))
    .reduce((sum, p) => sum + Math.abs(p.current_balance), 0);

  // DataTable column definitions
  const columns: ColumnDef<Party>[] = [
    {
      accessorKey: "name",
      header: t("ledgers.name"),
      cell: ({ row }) => (
        <div>
          <span
            className="font-bold text-[#151328] hover:underline cursor-pointer block text-sm"
            onClick={() => handleOpenStatement(row.original)}
          >
            {row.original.name}
          </span>
          {row.original.address && (
            <span className="text-[10px] text-slate-400 block mt-0.5">{row.original.address}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("ledgers.phone"),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.phone}</span>,
    },
    {
      accessorKey: "current_balance",
      header: t("ledgers.balanceCol"),
      meta: { align: "text-right" },
      cell: ({ row }) => {
        const bal = row.original.current_balance;
        const partyType = row.original.party_type;
        
        let label = t("ledgers.settled");
        let style = "text-slate-500 bg-slate-50 border-slate-100";
        
        if (partyType === "customer") {
          if (bal > 0) {
            label = `${t("ledgers.owesYou")} ₹${bal.toFixed(2)}`;
            style = "text-red-700 bg-red-50 border-red-100 font-bold";
          } else if (bal < 0) {
            label = `${t("ledgers.youOweThem")} ₹${Math.abs(bal).toFixed(2)}`;
            style = "text-amber-700 bg-amber-50 border-amber-100 font-bold";
          }
        } else { // supplier
          if (bal < 0) {
            label = `${t("ledgers.youOweThem")} ₹${Math.abs(bal).toFixed(2)}`;
            style = "text-red-700 bg-red-50 border-red-100 font-bold";
          } else if (bal > 0) {
            label = `${t("ledgers.owesYou")} ₹${bal.toFixed(2)}`;
            style = "text-amber-700 bg-amber-50 border-amber-100 font-bold";
          }
        }

        return (
          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] border tracking-wide", style)}>
            {label}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      meta: { align: "text-right" },
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => handleOpenStatement(row.original)}
            className="h-8 px-3 rounded-lg hover:bg-slate-100 text-[#4338CA] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {t("ledgers.viewBook")}
          </button>
          <button
            onClick={() => {
              setSelectedParty(row.original);
              setIsPaymentOpen(true);
            }}
            className="h-8 px-3 rounded-lg bg-white border border-[#C7C7E0] hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <IndianRupee className="h-3.5 w-3.5" />
            {t("ledgers.recordPayment")}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full font-sans select-none">
      
      {/* Header section with Toolbar */}
      <div className="bg-white px-6 py-4.5 rounded-t-xl border border-[#E4E4F0] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#151328] flex items-center gap-2">
            {t("ledgers.title")}
          </h1>
          <p className="text-xs font-semibold text-[#65637D] mt-0.5">
            {t("ledgers.subtitle").replace("{total}", String(total))}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A2B3]" />
            <input
              type="text"
              placeholder={t("ledgers.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9.5 pl-9 pr-4 w-60 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] placeholder-[#98A2B3] focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] outline-none bg-[#F7F7FB]"
            />
          </div>

          {/* Add contact CTA */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-9.5 px-4 bg-brand hover:bg-indigo-700 text-white text-sm font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <UserPlus className="h-4 w-4" />
            {t("ledgers.addContact")}
          </button>
        </div>
      </div>

      {/* Tabs list toggle bar */}
      <div className="flex bg-white px-6 border-b border-[#E4E4F0] gap-6">
        <button
          onClick={() => setActiveTab("customer")}
          className={cn(
            "py-3 text-sm font-bold border-b-2 cursor-pointer transition-colors outline-none",
            activeTab === "customer"
              ? "border-brand text-brand"
              : "border-transparent text-[#65637D] hover:text-[#151328]"
          )}
        >
          {t("ledgers.customerTab")}
        </button>
        <button
          onClick={() => setActiveTab("supplier")}
          className={cn(
            "py-3 text-sm font-bold border-b-2 cursor-pointer transition-colors outline-none",
            activeTab === "supplier"
              ? "border-brand text-brand"
              : "border-transparent text-[#65637D] hover:text-[#151328]"
          )}
        >
          {t("ledgers.supplierTab")}
        </button>
      </div>

      {/* Net Summary Dashboard row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-slate-50 border-b border-[#E4E4F0]">
        <div className="bg-white p-4.5 rounded-xl border border-[#E2E8F0] flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {activeTab === "customer" ? t("ledgers.theyOwe") : t("ledgers.theyOwe")}
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600 block mt-0.5">
              ₹{theyOweTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-[#E2E8F0] flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {activeTab === "customer" ? t("ledgers.youOwe") : t("ledgers.youOwe")}
            </span>
            <span className="text-xl font-bold font-mono text-amber-600 block mt-0.5">
              ₹{weOweTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Contacts DataTable list */}
      <DataTable
        columns={columns}
        data={parties}
        loading={loading}
        total={total}
        limit={limit}
        offset={offset}
        onPageChange={(newOffset) => setOffset(newOffset)}
        showingText={t("catalog.showing")}
      />

      {/* Ledger statement (passbook) drawer */}
      {selectedParty && (
        <div className="fixed inset-0 z-50 flex justify-end font-sans">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-xs" onClick={() => setSelectedParty(null)} />
          <div className="relative w-full max-w-[550px] bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#E4E4F0] animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="px-6 py-4.5 border-b border-[#E4E4F0] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t("ledgers.ledgerBook")}
                </span>
                <h3 className="text-base font-bold text-[#151328] mt-0.5">
                  {selectedParty.name}
                </h3>
                <span className="text-xs text-slate-400 font-mono block mt-0.5">{selectedParty.phone}</span>
              </div>
              <button
                onClick={() => setSelectedParty(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Passbook Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Balances card */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t("ledgers.balanceCol")}
                  </span>
                  <span className="text-2xl font-bold font-mono text-[#151328] block mt-0.5">
                    ₹{statement ? Math.abs(statement.current_balance).toFixed(2) : Math.abs(selectedParty.current_balance).toFixed(2)}
                  </span>
                </div>

                <div>
                  {((statement ? statement.current_balance : selectedParty.current_balance) === 0) ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {t("ledgers.settled")}
                    </span>
                  ) : ((selectedParty.party_type === "customer" && (statement ? statement.current_balance : selectedParty.current_balance) > 0) || 
                       (selectedParty.party_type === "supplier" && (statement ? statement.current_balance : selectedParty.current_balance) < 0)) ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                      {t("ledgers.balanceDue")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                      {t("ledgers.advancePaid")}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions log list */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-[#151328] uppercase tracking-wider border-b pb-2">
                  Passbook Entries
                </h4>
                
                {statementLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-brand" />
                    <span className="text-xs font-semibold">Loading statement...</span>
                  </div>
                ) : statement?.entries.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <BookOpen className="h-8 w-8 mx-auto stroke-1 mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">No passbook entries found for this contact.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {statement?.entries.map((entry) => {
                      const isDebit = entry.entry_type === "debit";
                      const date = new Date(entry.created_at);
                      
                      return (
                        <div key={entry.id} className="p-3.5 bg-white border border-slate-100 rounded-xl flex justify-between gap-4 text-xs hover:shadow-xs transition-shadow">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wide",
                                isDebit ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                              )}>
                                {isDebit ? "Debit (-)" : "Credit (+)"}
                              </span>
                              <span className="font-mono text-slate-400">
                                {date.toLocaleDateString("en-IN")} {date.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            {entry.note && (
                              <p className="text-slate-600 font-medium truncate block">{entry.note}</p>
                            )}
                            
                            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wide">
                              Ref: {entry.reference_type}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={cn("font-bold font-mono text-sm block", isDebit ? "text-red-600" : "text-emerald-600")}>
                              {isDebit ? "-" : "+"}₹{entry.amount.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-1">
                              Bal: ₹{entry.balance_after.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Sticky Passbook payment settle bottom bar */}
            <div className="bg-[#F8FAFC] border-t border-[#E4E4F0] p-6 flex gap-3 shrink-0">
              <button
                onClick={() => {
                  setIsPaymentOpen(true);
                }}
                className="w-full h-11 bg-brand hover:bg-indigo-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100 cursor-pointer animate-in fade-in"
              >
                <Landmark className="h-4 w-4" />
                {t("ledgers.recordCashPayment")}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Contact Modal Popup Component */}
      <AddContactDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        partyType={activeTab}
        onSuccess={loadParties}
      />

      {/* Record Payment Dialog Popup Component */}
      <RecordPaymentDialog
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        party={selectedParty}
        onSuccess={() => {
          if (selectedParty) {
            loadStatement(selectedParty.id);
          }
          loadParties();
        }}
      />

    </div>
  );
}

