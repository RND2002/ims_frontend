"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { 
  useGetExpensesQuery, 
  useCreateExpenseMutation, 
  useDeleteExpenseMutation,
  Expense 
} from "@/lib/features/expenses/expensesApi";
import { 
  Plus, 
  Trash2, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  FileText,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

export default function ExpensesPage() {
  const { t } = useLanguage();
  const params = useParams();
  const storeId = params.storeId as string;

  // Page filter states
  const [categoryFilter, setCategoryFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("Utilities");
  const [newAmount, setNewAmount] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Confirm delete dialog state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // RTK Query hooks
  const { data, isLoading: loading, refetch } = useGetExpensesQuery({
    category: categoryFilter || undefined,
    limit,
    offset,
  }, { skip: !storeId });

  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();
  const [isDeleting, setIsDeleting] = useState(false);

  const expenses = data?.items || [];
  const totalCount = data?.total || 0;

  // Reset page on filter changes
  useEffect(() => {
    setOffset(0);
  }, [categoryFilter]);

  // Aggregate stats
  const totalExpensesSum = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentMonthExpenses = expenses
    .filter((e) => {
      const dateObj = new Date(e.expense_date);
      const now = new Date();
      return dateObj.getMonth() === now.getMonth() && dateObj.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // Categories count
  const categoryCounts = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  // Handle create submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(newAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setValidationError("Please enter a valid positive amount");
      return;
    }
    setValidationError(null);
    try {
      await createExpense({
        category: newCategory,
        amount: parsedAmt,
        description: newDescription || undefined,
        expense_date: newDate,
      }).unwrap();
      
      // Reset & close
      setNewAmount("");
      setNewDescription("");
      setNewDate(new Date().toISOString().split("T")[0]);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setValidationError(err?.message || "Failed to create expense entry");
    }
  };

  // Handle delete
  const handleDeleteRow = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await deleteExpense(deleteConfirmId).unwrap();
    } catch (err) {
      console.error("Failed to delete expense:", err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  // Column definitions for the DataTable
  const columns: ColumnDef<Expense>[] = [
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() => handleDeleteRow(row.original.id)}
          className="h-8 w-8 rounded-lg border border-[#E4E4F0] hover:border-red-200 bg-white hover:bg-red-50 text-[#65637D] hover:text-[#DC2626] flex items-center justify-center transition-all cursor-pointer outline-none mx-auto"
          title="Delete Expense"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
    {
      accessorKey: "category",
      header: () => <span className="text-[10px] uppercase font-bold tracking-wider text-[#65637D]">Category</span>,
      cell: ({ row }) => {
        const val = row.getValue("category") as string;
        let colorClasses = "bg-[#EEF2FF] text-[#4338CA] border-[#C7C7E0]";
        if (val === "Rent") colorClasses = "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]";
        if (val === "Salary") colorClasses = "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]";
        if (val === "Others") colorClasses = "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]";
        
        return (
          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border", colorClasses)}>
            {val}
          </span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: () => <span className="text-[10px] uppercase font-bold tracking-wider text-[#65637D]">Amount</span>,
      cell: ({ row }) => {
        const val = row.getValue("amount") as number;
        return (
          <span className="font-bold font-mono text-sm text-[#151328] tabular-nums">
            ₹{val.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "description",
      header: () => <span className="text-[10px] uppercase font-bold tracking-wider text-[#65637D] hidden md:table-cell">Description</span>,
      cell: ({ row }) => (
        <span className="text-xs text-[#65637D] font-medium hidden md:block max-w-[240px] truncate">
          {row.getValue("description") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "expense_date",
      header: () => <span className="text-[10px] uppercase font-bold tracking-wider text-[#65637D] hidden sm:table-cell">Date</span>,
      cell: ({ row }) => {
        const d = new Date(row.getValue("expense_date") as string);
        return (
          <span className="text-xs font-semibold text-[#65637D] font-mono hidden sm:inline">
            {d.toLocaleDateString("en-IN")}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 font-sans select-none pb-12 w-full min-w-0">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#151328] tracking-tight">
            {t("sidebar.nav.expenses")}
          </h1>
          <p className="mt-1 text-xs text-[#65637D] font-semibold">
            Track utility bills, staff wages, shop rent, and other operational expenses.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-[#FF6B5B] hover:bg-[#E5503F] text-xs font-bold text-white shadow-sm transition-colors cursor-pointer border-none outline-none select-none w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Expenses */}
        <div className="bg-white rounded-xl border border-[#E4E4F0] p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-[#FEE2E2] flex items-center justify-center text-red-600 shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Expenses</span>
            <span className="text-xl font-bold font-mono text-[#151328] block mt-0.5">₹{totalExpensesSum.toFixed(2)}</span>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-xl border border-[#E4E4F0] p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-blue-600 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">This Month</span>
            <span className="text-xl font-bold font-mono text-[#151328] block mt-0.5">₹{currentMonthExpenses.toFixed(2)}</span>
          </div>
        </div>

        {/* Top Category */}
        <div className="bg-white rounded-xl border border-[#E4E4F0] p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-[#ECFDF5] flex items-center justify-center text-emerald-600 shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Category</span>
            <span className="text-base font-bold text-[#151328] block mt-0.5 truncate max-w-[160px]">
              {Object.keys(categoryCounts).length > 0 
                ? Object.entries(categoryCounts).sort((a,b) => b[1] - a[1])[0][0]
                : "None"}
            </span>
          </div>
        </div>
      </div>

      {/* Main List and Filters Container */}
      <div className="flex flex-col w-full min-w-0">
        
        {/* Filters Toolbar */}
        <div className="bg-white rounded-t-xl border border-[#E4E4F0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 w-full sm:w-64">
            <div className="relative flex-1">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 pl-3 pr-9 rounded-lg border border-[#E4E4F0] bg-white text-xs font-bold text-[#65637D] appearance-none outline-none focus:border-[#4338CA] cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="Utilities">Utilities</option>
                <option value="Salary">Salary</option>
                <option value="Rent">Rent</option>
                <option value="Others">Others</option>
              </select>
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#65637D] pointer-events-none" />
            </div>
          </div>

          <div className="text-xs font-bold text-[#65637D]">
            Total Entries: {totalCount}
          </div>
        </div>

        {/* Data list view */}
        <div className="bg-white rounded-b-xl border border-[#E4E4F0] border-t-0 flex flex-col">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center px-4">
              <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-[#151328]">No expenses recorded</h3>
              <p className="text-[11px] text-[#65637D] mt-1">Click "Add Expense" to register your first operational expense.</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={expenses}
              total={totalCount}
              limit={limit}
              offset={offset}
              onPageChange={setOffset}
            />
          )}
        </div>
      </div>

      {/* Add Expense Popup Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-[#E4E4F0] animate-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-bold text-[#151328] text-base">Record Store Expense</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {validationError && (
              <div className="p-2.5 mb-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {validationError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Expense Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-semibold cursor-pointer bg-white"
                >
                  <option value="Utilities">💡 Utilities (Electricity, Water, Internet)</option>
                  <option value="Salary">💼 Salary (Staff wages)</option>
                  <option value="Rent">🏢 Rent (Shop rent)</option>
                  <option value="Others">📦 Others (Packaging, snacks, miscellaneous)</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1500"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-bold font-mono"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-semibold font-mono"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Description / Notes</label>
                <textarea
                  placeholder="e.g. Electricity bill for July 2026"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full h-16 p-3 rounded-lg border border-[#C7C7E0] text-sm text-[#151328] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-semibold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full h-11 bg-brand text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-indigo-700 flex items-center justify-center transition-all disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </div>
  );
}
