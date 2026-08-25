"use client";

import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  HeaderGroup,
  Header,
  Row,
  Cell,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  
  // Server-side pagination
  total?: number;
  limit?: number;
  offset?: number;
  onPageChange?: (offset: number) => void;
  showingText?: string;
  
  // Row selection
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  total = 0,
  limit = 10,
  offset = 0,
  onPageChange,
  showingText = "Showing {start}-{end} of {total} items",
  rowSelection = {},
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: (updater: any) => {
      if (onRowSelectionChange) {
        const nextSelection =
          typeof updater === "function" ? updater(rowSelection) : updater;
        onRowSelectionChange(nextSelection);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  // Calculate current showing range
  const startRange = total === 0 ? 0 : offset + 1;
  const endRange = Math.min(offset + limit, total);
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const handlePageClick = (page: number) => {
    if (onPageChange) {
      onPageChange((page - 1) * limit);
    }
  };

  return (
    <div className="bg-white rounded-b-xl border border-[#E4E4F0] border-t-0 flex flex-col font-sans select-none overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
            <tr key={headerGroup.id} className="bg-[#F7F7FB] border-b border-[#C7C7E0]">
              {headerGroup.headers.map((header: Header<TData, unknown>) => {
                const align = (header.column.columnDef.meta as any)?.align || "text-left";
                return (
                  <th
                    key={header.id}
                    className={cn(
                      "px-4 py-3 text-[10px] uppercase font-bold tracking-wider text-[#65637D] select-none",
                      align
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="relative">
          {loading ? (
            // Skeleton loader state
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx} className="border-b border-[#E4E4F0] animate-pulse">
                {columns.map((_, cIdx) => (
                  <td key={cIdx} className="px-4 py-4">
                    <div className="h-4 bg-slate-100 rounded-md w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row: Row<TData>) => (
              <tr
                key={row.id}
                className={cn(
                  "group border-b border-[#E4E4F0] last:border-0 hover:bg-[#F7F7FB] transition-colors relative align-middle",
                  row.getIsSelected() && "bg-[#F7F7FB]"
                )}
              >
                {row.getVisibleCells().map((cell: Cell<TData, unknown>) => {
                  const align = (cell.column.columnDef.meta as any)?.align || "text-left";
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        "px-4 py-3.5 text-sm text-[#151328] font-medium align-middle",
                        align
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-[#65637D] font-bold">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination controls */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between border-t border-[#E4E4F0] bg-white px-6 py-4 rounded-b-xl">
          <span className="text-xs font-semibold text-[#65637D]">
            {showingText
              .replace("{start}", String(startRange))
              .replace("{end}", String(endRange))
              .replace("{total}", String(total))}
          </span>

          {totalPages > 1 && onPageChange && (
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
      )}
    </div>
  );
}
