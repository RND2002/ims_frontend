"use client";

import React from "react";
import { AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
  loadingText?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
  loadingText = "Processing...",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getThemeClasses = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "bg-red-50 text-red-600 border-red-100",
          icon: <AlertTriangle className="h-5 w-5" />,
          confirmBtn: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 text-amber-600 border-amber-100",
          icon: <AlertTriangle className="h-5 w-5" />,
          confirmBtn: "bg-amber-600 hover:bg-amber-750 text-white",
        };
      default:
        return {
          iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
          icon: <Info className="h-5 w-5" />,
          confirmBtn: "bg-[#4338CA] hover:bg-[#3730A3] text-white",
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        onClick={isLoading ? undefined : onClose}
        className="absolute inset-0 bg-[#151328]/35 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
      />

      {/* Modal box */}
      <div className="relative w-full max-w-sm rounded-xl border border-[#E4E4F0] bg-white p-5 shadow-2xl z-10 transition-all text-left animate-in zoom-in-95 duration-150 font-sans">
        
        {/* Close button */}
        {!isLoading && (
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer outline-none border-none"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex gap-4">
          {/* Icon */}
          <div className={`flex items-center justify-center h-10 w-10 rounded-lg border shrink-0 ${theme.iconBg}`}>
            {theme.icon}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-sm font-bold text-[#151328] tracking-tight">
              {title}
            </h3>
            <p className="text-[11px] font-semibold text-[#65637D] leading-relaxed mt-1">
              {message}
            </p>
          </div>
        </div>

        {/* Action buttons footer */}
        <div className="flex items-center justify-end gap-2.5 mt-5 border-t border-[#E4E4F0] pt-3.5">
          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="outline"
            className="h-8.5 px-3.5 text-xs font-bold border-[#E4E4F0] bg-white text-[#65637D] hover:bg-[#F7F7FB]"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`h-8.5 px-4 text-xs font-bold rounded-lg border-none shadow-xs ${theme.confirmBtn}`}
          >
            {isLoading ? loadingText : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
